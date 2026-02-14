import { K } from "../../src/context";
import { Entity } from "../entity/Entity";
import { JSONObject, JSONValue } from "../../src/utils/JSON";
import { FUNCTIONS_MAP } from "./functions";

export type Env = JSONObject;
export type TracebackArray = (string | { f: string, n: number })[]

export type TaskGen = Generator<void, any, void>;
export class Task {
    paused = false;
    tc = false;
    complete = false;
    gen: TaskGen = null as any;
    result: any;
    failed = false;
    done(value: any) {
        this.complete = true;
        this.result ??= value;
        this._finish.trigger(this.result);
    }
    get awaited() { return this._finish.numListeners() > 0; }
    private _finish = new K.KEvent<[any]>();
    constructor(public id: string, public priority: number, public entity: Entity | null) { }
    onFinish(cb: (value: any) => void) {
        return this._finish.add(cb);
    }
}

function bumpTailCall(name: string, traceback: TracebackArray) {
    const last = traceback.at(-1);
    if (typeof last !== "object" || last.f !== name) traceback.push({ f: name, n: 1 });
    else last.n++;
}

function stringifyTraceback(traceback: TracebackArray) {
    return traceback.map(tb => typeof tb === "string" ? tb : `${tb.f} (tc ${tb.n})`).join(" > ");
}

export function tracebackError(error: Error | string, traceback: TracebackArray) {
    var m: string, e: Error;
    const tb = stringifyTraceback(traceback);
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

export class ScriptRunner {
    constructor(public fn = FUNCTIONS_MAP) { }

    lockupCheck(tb: TracebackArray) {
        console.error(stringifyTraceback(tb));
    }

    *eval(form: JSONValue, task: Task, actor: Entity | null, env: Env, context: Env, traceback: TracebackArray): TaskGen {
        for (; ;) {
            task.tc = false;
            if (!Array.isArray(form)) return form;
            const name = form[0];
            if (typeof name !== "string") throw tracebackError("illegal function name " + name, traceback);
            const impl = this.fn[name];
            if (!impl) throw tracebackError(`no such function ${JSON.stringify(name)}`, traceback);
            const args = form.slice(1);
            if (!impl.special) {
                for (var i = 1; i < form.length; i++) {
                    task.tc = false;
                    args[i - 1] = yield* this.eval(form[i]!, task, actor, env, context, traceback);
                }
            }
            task.tc = false;
            try {
                traceback.push(name);
                form = yield* impl.eval(this, args, task, actor, env, context, traceback);
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

    private _t: Task[] = [];

    addTask(id: string, priority: number, form: JSONValue, actor: Entity | null, context: Env, exclusive = false): Task {
        if (exclusive) {
            const t2 = this._t.find(t => t.id === id);
            if (t2) return t2;
        }
        const t = new Task(id, priority, actor);
        t.gen = this.eval(form, t, actor, {}, context, []);
        this._t.push(t);
        K.insertionSort(this._t, (t1, t2) => t1.priority > t2.priority);
        return t;
    }

    endTasksBy(actor: Entity) {
        for (var i = 0; i < this._t.length; i++) {
            if (this._t[i]!.entity === actor) {
                this._t[i]!.done(undefined);
                this._t.splice(i--, 1);
            }
        }
    }

    private _mPBE = new Map<Entity | null, number>();
    runAll() {
        do {
            var madeProgress = false;
            this._mPBE.clear();
            for (var i = 0; i < this._t.length; i++) {
                const t = this._t[i]!;
                if (t.paused || (this._mPBE.has(t.entity) && this._mPBE.get(t.entity)! > t.priority)) {
                    continue;
                }
                this._mPBE.set(t.entity, t.priority);
                madeProgress = true;
                var res: Partial<IteratorResult<any>> = {};
                try {
                    res = t.gen!.next();
                } catch (e) {
                    if (t.awaited) {
                        t.failed = true;
                        t.done(e);
                    } else throw e;
                }
                if (res.done) {
                    t.done(res.value);
                }
                if (t.complete) {
                    this._t.splice(i--, 1);
                }
            }
        } while (madeProgress);
    }

    call(entryName: string, code: JSONValue, context: Env): any {
        const task = this.addTask("__call", 0, code, null, context);
        this.runAll();
        if (!task.complete || task.failed) {
            throw new Error(`code for ${entryName} must return a value without pausing`);
        }
        return task.result;
    }
}

const mainHandler = new ScriptRunner;

export const endTasksBy = mainHandler.endTasksBy.bind(mainHandler);
export const addTask = mainHandler.addTask.bind(mainHandler);

export function startMainLoop() {
    K.onUpdate(() => mainHandler.runAll());
}
