import { Entity } from "../entity/Entity";
import { Task, Env, TracebackArray, TaskGen, ScriptRunner } from "./ScriptHandler";

export type FormFunc = (runner: ScriptRunner, args: any[], task: Task, actor: Entity | null, env: Env, context: Env, traceback: TracebackArray) => TaskGen;
export class Form {
    private argc: number = -1;
    constructor(public name: string, public special: boolean, private f: FormFunc) {
        const n = /function[\s\w\d*]*\(\w*,\s*\[([^\]]*)\]/.exec("" + f);
        if (n) {
            this.argc = n[1]!.length > 0 ? /\.{3}/.test(n[1]!) ? -1 : n[1]!.split(",").length : 0;
            console.log("this.name", [name, n[0], n[1], this.argc]);
        }
    }
    eval(runner: ScriptRunner, args: any[], task: Task, actor: Entity | null, env: Env, context: Env, traceback: TracebackArray) {
        if (this.argc >= 0 && args.length > this.argc) {
            console.warn("too many args to " + this.name, args, task);
        }
        return this.f(runner, args, task, actor, env, context, traceback);
    }
}
