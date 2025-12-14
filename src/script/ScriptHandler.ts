import { K } from "../context";
import { Entity } from "../entity/Entity";
import { JSONObject, JSONValue } from "../JSON";
import { FUNCTIONS_MAP } from "./functions";

export type Env = JSONObject;
export type TracebackArray = (string | { f: string, n: number })[]

export type TaskGen = AsyncGenerator<void, any, void>;
export class Task {
    paused = false;
    tc = false;
    complete = new K.KEvent;
    gen: TaskGen = null as any;
    result: any;
    failed: boolean = false;
    constructor(public priority: number, public controller: Entity) { }
    onFinish(cb: (value: any) => void) {
        return this.complete.add(cb);
    }
}

function bumpTailCall(name: string, traceback: TracebackArray) {
    const last = traceback.at(-1);
    if (typeof last !== "object" || last.f !== name) traceback.push({ f: name, n: 1 });
    else last.n++;
}

export function tracebackError(error: Error | string, traceback: TracebackArray) {
    var m: string, e: Error;
    const tb = traceback.map(tb => typeof tb === "string" ? tb : `${tb.f} (tc ${tb.n})`).join(" > ");
    switch (typeof error) {
        case "string":
            m = `${error}\ntraceback: ${tb}`;
            e = new Error(m);
            break;
        default:
            m = `${error.message}\ntraceback: ${tb}`;
            if ((error as any)._tb) {
                e = error;
            }
            else {
                e = new Error(m, { cause: error });
            }
    }
    (e as any)._tb = true;
    return e;
}

export async function* evaluateForm(form: JSONValue, task: Task, actor: Entity, env: Env, context: Env, traceback: TracebackArray): TaskGen {
    for (; ;) {
        task.tc = false;
        if (!Array.isArray(form)) return form;
        const name = form[0];
        if (typeof name !== "string") throw tracebackError("illegal function name " + name, traceback);
        const impl = FUNCTIONS_MAP[name];
        if (!impl) throw tracebackError(`no such function ${JSON.stringify(name)}`, traceback);
        const args = form.slice(1);
        if (!impl.special) {
            for (var i = 1; i < form.length; i++) {
                task.tc = false;
                args[i - 1] = yield* evaluateForm(form[i]!, task, actor, env, context, traceback);
            }
        }
        task.tc = false;
        try {
            traceback.push(name);
            form = yield* impl.eval(args, task, actor, env, context, traceback);
        } catch (e: any) {
            throw tracebackError(e, traceback);
        } finally {
            traceback.pop();
        }
        if (!task.tc) break;
        bumpTailCall(name, traceback);
    }
    task.tc = false;
    return form;
}

const tasks: Task[] = [];

function sortTasks() {
    K.insertionSort(tasks, (t1, t2) => t1.priority > t2.priority);
}

// TODO: use actor-local priority instead of global priority
export function spawnTask(priority: number, form: JSONValue, actor: Entity, context: Env): Task {
    const t = new Task(priority, actor);
    t.gen = evaluateForm(form, t, actor, {}, context, []);
    tasks.push(t);
    sortTasks();
    return t;
}

export function killAllTasksControlledBy(actor: Entity) {
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i]!.controller === actor) {
            tasks[i]!.complete.trigger(undefined);
            tasks.splice(i--, 1);
        }
    }
}

async function stepTasks() {
    var madeProgress = false;
    var runnedP = undefined;
    for (var i = 0; i < tasks.length; i++) {
        const t = tasks[i]!;
        if (t.paused) continue;
        if (runnedP !== undefined && runnedP > t.priority) break;
        runnedP = t.priority;
        madeProgress = true;
        var res;
        try {
            res = await t.gen!.next();
        } catch (e) {
            if (t.complete.numListeners() > 0) {
                t.failed = true;
                t.result = e;
                res = { done: true };
            } else throw e;
        }
        if (res.done || t.result) {
            t.complete.trigger(t.result ?? res.value);
            tasks.splice(i--, 1);
        }
    }
    return madeProgress;
}

export async function advanceAsFarAsPossible() {
    while (await stepTasks());
}

export function startMainLoop() {
    const u = K.onUpdate(async () => {
        u.paused = true;
        await advanceAsFarAsPossible();
        u.paused = false;
    });
}
