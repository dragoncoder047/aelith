import { Vec2 } from "kaplay";
import { K } from "../context";
import { Entity } from "./Entity";

export class DisplayEntity extends Entity {
    constructor(
        kind: string,
        pos: Vec2,
    ) {
        super("", null, kind, {}, pos, undefined, undefined, []);
        this.load();
    }
    load() {
        super.load();
        this.obj!.unuse("body");
        this.obj!.unuse("area");
        K.onSceneLeave(() => {
            this.destroy();
        });
        this.startHook("loadAsDisplay");
    }
}
