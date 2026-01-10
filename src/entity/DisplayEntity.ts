import { Vec2 } from "kaplay";
import { K } from "../context";
import * as ScriptHandler from "../script/ScriptHandler";
import { Entity } from "./Entity";
import * as EntityManager from "./EntityManager";
import { JSONObject } from "../JSON";

export class DisplayEntity extends Entity {
    constructor(
        kind: string,
        pos: Vec2,
        state: JSONObject,
    ) {
        super(EntityManager.blankEntityId(kind), null, kind, state, pos, undefined, undefined);
        this.load();
    }
    load() {
        super.load();
        this.obj!.unuse("body");
        this.obj!.unuse("area");
        this._unloadedBySceneChange?.cancel();
        K.onSceneLeave(() => {
            ScriptHandler.killAllTasksControlledBy(this);
        });
        this.startHook("loadAsDisplay");
        this.obj!.unuse("layer");
        Object.values(this.bones).forEach(b => b.unuse("layer"));
    }
}
