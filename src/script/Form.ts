import { Entity } from "../entity/Entity";
import { Task, Env, TracebackArray, TaskGen } from "./ScriptHandler";

export type FormFunc = (args: any[], task: Task, actor: Entity | null, env: Env, context: Env, traceback: TracebackArray) => TaskGen;
export class Form {
    private argc: number = -1;
    constructor(public name: string, public special: boolean, private f: FormFunc) {
        const n = /function[\s\w\d*]*\(\[([^\]])\]/.exec("" + f);
        if (n) {
            this.argc = n[1]!.length > 0 ? n[1]!.split(",").length : 0;
        }
    }
    eval(args: any[], task: Task, actor: Entity | null, env: Env, context: Env, traceback: TracebackArray) {
        if (this.argc >= 0 && args.length > this.argc) {
            console.warn("too many args to " + this.name, args, task);
        }
        return this.f(args, task, actor, env, context, traceback);
    }
}
