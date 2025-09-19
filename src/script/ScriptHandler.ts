import { K } from "../context";
import { Entity } from "../entity/Entity";
import { JSONObject, JSONValue } from "../JSON";
import * as EntityManager from "../entity/EntityManager";

type Env = JSONObject;
type TracebackArray = (string | { f: string, n: number })[]

type TaskGen = Generator<void, any, void>;
export class Task {
    paused = false;
    tc = false;
    complete = new K.KEvent;
    gen: TaskGen = null as any;
    constructor(public priority: number) { }
    onFinish(cb: (value: any) => void) {
        return this.complete.add(cb);
    }
}

function bumpTailCall(name: string, traceback: TracebackArray) {
    const last = traceback.at(-1);
    if (typeof last !== "object" || last.f !== name) traceback.push({ f: name, n: 1 });
    else last.n++;
}

type FormFunc = (args: any[], task: Task, actor: Entity, env: Env, context: Env, traceback: TracebackArray) => TaskGen;
export class Form {
    constructor(public name: string, public special: boolean, private f: FormFunc) { }
    eval(args: any[], task: Task, actor: Entity, env: Env, context: Env, traceback: TracebackArray) {
        return this.f(args, task, actor, env, context, traceback);
    }
}

function tracebackError(error: string, traceback: TracebackArray) {
    return new Error(`${error}\ntraceback: ${traceback.map(tb => typeof tb === "string" ? tb : `${tb.f} (tc ${tb.n})`).join(" > ")}`);
}

function* evaluateForm(form: JSONValue, task: Task, actor: Entity, env: Env, context: Env, traceback: TracebackArray): TaskGen {
    do {
        task.tc = false;
        if (!Array.isArray(form)) return form;
        const name = form[0];
        if (typeof name !== "string") throw tracebackError("illegal function name " + name, traceback);
        const impl = FUNCTIONS.find(f => f.name === name);
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
            const newError = tracebackError(e?.message ?? String(e), traceback);
            newError.cause = e;
            throw newError;
        } finally {
            traceback.pop();
        }
        if (task.tc) bumpTailCall(name, traceback);
    } while (task.tc);
    task.tc = false;
    return form;
}

const tasks: Task[] = [];

function sortTasks() {
    tasks.sort((t1, t2) => t2.priority - t1.priority);
}

export function spawnTask(priority: number, form: JSONValue, actor: Entity, context: Env): Task {
    const t = new Task(priority);
    t.gen = evaluateForm(form, t, actor, {}, context, []);
    tasks.push(t);
    sortTasks();
    return t;
}

function stepTasks() {
    var madeProgress = false;
    var runnedP = undefined;
    for (var i = 0; i < tasks.length; i++) {
        const t = tasks[i]!;
        if (t.paused) continue;
        if (runnedP !== undefined && runnedP > t.priority) break;
        runnedP = t.priority;
        madeProgress = true;
        const res = t.gen!.next();
        if (res.done) {
            t.complete.trigger(res.value);
            tasks.splice(i, 1);
            i--;
        }
    }
    return madeProgress;
}

export function advanceAsFarAsPossible() {
    while (stepTasks());
}

const FUNCTIONS: Form[] = [
    new Form("be", false, function* (args, task, actor) {
        const [slot, value, silent] = args;
        const oldValue = actor.state[slot];
        actor.state[slot] = value;
        if (!silent) {
            const subTask = EntityManager.startHookOnEntity(actor, "stateChanged", { slot, oldValue });
            if (subTask) {
                task.paused = true;
                subTask.onFinish(() => task.paused = false);
            }
        }
        return value;
    }),
    new Form("as", true, function* ([who, ...what], task, _, env, context, traceback) {
        const realActor = EntityManager.getEntityByName(who);
        if (!realActor) throw tracebackError(`no such actor named ${JSON.stringify(who)}`, traceback);
        return yield* evaluateForm(what, task, realActor, env, context, traceback);
    }),
    new Form("do", true, function* (forms, task, actor, env, context, traceback) {
        for (var i = 0; i < forms.length - 1; i++) {
            env.it = env.them = yield* evaluateForm(forms[i]!, task, actor, env, context, traceback);
        }
        task.tc = true;
        return forms.at(-1);
    }),
    new Form("when", true, function* ([cond, ...body], task) {
        task.tc = true;
        return ["if", cond, ["do", ...body]];
    }),
    new Form("unless", true, function* ([cond, ...body], task) {
        task.tc = true;
        return ["if", cond, undefined, ["do", ...body]];
    }),
    new Form("if", true, function* ([test, a, b], task, actor, env, context, traceback) {
        const cond = yield* evaluateForm(test, task, actor, env, context, traceback);
        task.tc = true;
        return cond ? a : b;
    }),
    new Form("switch", false, function* ([value, cases], task) {
        task.tc = true;
        return cases[value];
    }),
    new Form("each", true, function* ([name, listEx, ...body], task, actor, env, context, traceback) {
        const block = ["do", ...body];
        const list = yield* evaluateForm(listEx, task, actor, env, context, traceback);
        for (var item of list) {
            env[name] = item;
            yield* evaluateForm(block, task, actor, env, context, traceback);
        }
    }),
    new Form("while", true, function* ([test, ...body], task) {
        const b = ["do", ...body];
        task.tc = true;
        return ["when", test, b, ["while", test, b]];
    }),
    new Form("until", true, function* ([test, ...body], task) {
        const b = ["do", ...body];
        task.tc = true;
        return ["unless", test, b, ["until", test, b]];
    }),
    new Form("iota", false, function* ([start, stop, step]) {
        const l = [];
        for (var i = start; i < stop; i += step ?? 1) l.push(i);
        return l;
    }),
    new Form("repeat", true, function* ([name, range, ...body], task) {
        task.tc = true;
        return ["each", name, ["iota", ...range], ...body];
    }),
    new Form("ami", false, function* ([slot, target], _, actor) {
        const value = actor.state[slot];
        if (target !== undefined) {
            return value === target;
        }
        return !!value;
    }),
    new Form("my", false, function* ([slot], _, actor) {
        return actor.state[slot];
    }),
    new Form("render", false, function* ([slot, newValue], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
];
