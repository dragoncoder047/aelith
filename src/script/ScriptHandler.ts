import { K } from "../context";
import { Entity } from "../entity/Entity";
import { JSONObject, JSONValue } from "../JSON";

type Env = JSONObject;

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

type FormFunc = (args: any[], task: Task, actor: Entity, env: Env, context: Env, traceback: string[]) => TaskGen;
export class Form {
    constructor(public name: string, public special: boolean, private f: FormFunc) { }
    eval(args: any[], task: Task, actor: Entity, env: Env, context: Env, traceback: string[]) {
        return this.f(args, task, actor, env, context, traceback.concat([this.name]));
    }
}

function* evaluateForm(form: JSONValue, task: Task, actor: Entity, env: Env, context: Env, traceback: string[]): TaskGen {
    do {
        task.tc = false;
        if (!Array.isArray(form)) return form;
        const name = form[0];
        const impl = FUNCTIONS.find(f => f.name === name);
        if (!impl) throw new Error(`no such function ${JSON.stringify(name)}\ntraceback: ${traceback.join(">")}`);
        const args = form.slice(1);
        if (!impl.special) {
            for (var i = 1; i < form.length; i++) {
                args[i] = yield* evaluateForm(form[i]!, task, actor, env, context, traceback);
            }
        }
        form = yield* impl.eval(args, task, actor, env, context, traceback);
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
        }
    }
    return madeProgress;
}

export function advanceAsFarAsPossible() {
    while (stepTasks());
}

const FUNCTIONS: Form[] = [
];
