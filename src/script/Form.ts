import { Entity } from "../entity/Entity";
import { Task, Env, TracebackArray, TaskGen } from "./ScriptHandler";

export type FormFunc = (args: any[], task: Task, actor: Entity, env: Env, context: Env, traceback: TracebackArray) => TaskGen;
export class Form {
    constructor(public name: string, public special: boolean, private f: FormFunc) { }
    eval(args: any[], task: Task, actor: Entity, env: Env, context: Env, traceback: TracebackArray) {
        return this.f(args, task, actor, env, context, traceback);
    }
}
