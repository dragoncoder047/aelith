import { Entity } from "../entity/Entity";

type Env = Record<string, any>;
type FormFunc = (args: any[], actor: Entity, env: Env, context: Env, traceback: string[]) => void;
export class Form {
    f: FormFunc | null = null;
}
