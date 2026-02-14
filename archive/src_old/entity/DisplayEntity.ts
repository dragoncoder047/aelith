import { Vec2 } from "kaplay";
import { K } from "../../src/context";
import * as ScriptHandler from "../script/ScriptHandler";
import { Entity } from "./Entity";
import * as EntityManager from "./EntityManager";
import { JSONObject } from "../../src/utils/JSON";

export class DisplayEntity extends Entity {
    constructor(
        kind: string,
        pos: Vec2,
        state: JSONObject,
    ) {
        super(EntityManager.blankEntityId(`${kind}$display`), null, kind, state, pos, undefined, undefined);
        EntityManager.registerDisplayEntity(this);
        this.load();
    }
    load() {
        super.load();
        this._unloadedBySceneChange?.cancel();
        K.onSceneLeave(() => {
            ScriptHandler.endTasksBy(this);
        });
        this.startHook("loadAsDisplay");
        this.obj!.unuse("layer");
        this.obj!.collisionIgnore?.push("*");
        Object.values(this.bones).forEach(b => b.unuse("layer"));
    }
    override _updateGravityScale() {
        if (this.obj) {
            this.obj!.gravityScale = 0;
            for (var bone of Object.keys(this.bones)) {
                const b = this.bones[bone] as any;
                if (b.has("body") && !b.is("tentacle")) {
                    b.gravityScale = 0;
                    K.Vec2.copy(K.Vec2.ZERO, b.vel);
                }
            }
        }
    }
}
