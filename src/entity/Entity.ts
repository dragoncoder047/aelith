import { Comp, GameObj, PosComp, RotateComp, Vec2 } from "kaplay";
import { LightComp } from "kaplay-lighting";
import { K } from "../context";
import { EntityData, LightData, XY } from "../DataPackFormat";
import { JSONObject } from "../JSON";
import { Serializable } from "../Serializable";
import { EntityAnimation } from "./Animation";
import { buildHitbox, buildSkeleton } from "./build";
import * as EntityManager from "./EntityManager";

export interface EntityComp extends Comp {
    readonly entity: Entity;
}

export type EntityComponents = EntityComp | PosComp;
export type BoneComponents = EntityComponents | RotateComp;
export type BonesMap = Record<string, GameObj<BoneComponents>>;

export class Entity implements Serializable {
    obj: GameObj<EntityComponents> | null = null;
    bones: BonesMap = {};
    lightObjs: GameObj<PosComp | LightComp>[] = [];
    currentAnimations: EntityAnimation[] = [];
    constructor(
        public id: string,
        public currentRoom: string | null,
        public kind: string,
        public state: JSONObject,
        public pos: Vec2,
        public leashed: [string, number] | undefined,
        public linkGroup: string | undefined,
        public lights: LightData[]
    ) { }
    load() {
        K.onSceneLeave(() => {
            this.unloaded();
        });
        const self = this;
        this.obj = K.add([
            {
                id: "entity",
                get entity() { return self; },
                update() { self.update(); }
            } as EntityComp,
            this.id,
            this.kind,
            K.pos(this.pos),
        ]);
        buildHitbox(this, this.obj);
        this.bones = buildSkeleton(this, this.obj);
        EntityManager.startHookOnEntity(this, "load", {});
    }
    unloaded() {
        this.obj = null;
        this.bones = {};
        this.lightObjs = [];
        EntityManager.startHookOnEntity(this, "unload", {});
    }
    toJSON(): EntityData {
        return {
            id: this.id,
            kind: this.kind,
            state: this.state,
            leashed: this.leashed,
            lights: this.lightObjs.map(l => [
                l.pos.toArray() as XY,
                l.light!.radius,
                l.light!.strength,
                l.light!.color.toHex(),
                [] // TODO: serialize light tags once it's implemented
            ]),
            pos: this.pos.toArray() as XY,
        }
    }
    update() {
        this.pos = this.obj!.pos.clone();
        // TODO: tick animations
    }
}
