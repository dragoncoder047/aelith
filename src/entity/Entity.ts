import { Comp, GameEventMap, GameObj, PosComp, RotateComp, ScaleComp, Vec2 } from "kaplay";
import { LightComp } from "kaplay-lighting";
import { K } from "../context";
import { EntityData, LightData, XY } from "../DataPackFormat";
import { JSONObject } from "../JSON";
import { Serializable } from "../Serializable";
import { EntityAnimation } from "./Animation";
import { buildHitbox, buildSkeleton } from "./buildSkeleton";
import * as EntityManager from "./EntityManager";
import { speechBubble, SpeechBubbleComp } from "./comps/speechBubble";

export interface EntityComp extends Comp {
    readonly entity: Entity;
}

export type EntityComponents = EntityComp | PosComp;
export type BoneComponents = EntityComponents | RotateComp | ScaleComp;
export type BonesMap = Record<string, GameObj<BoneComponents>>;

export class Entity implements Serializable {
    obj: GameObj<EntityComponents> | null = null;
    bones: BonesMap = {};
    speechBubble: GameObj<SpeechBubbleComp> | null = null;
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
        this.speechBubble!.use(speechBubble());
        EntityManager.startHookOnEntity(this, "load", {});
        // this.obj.onPhysicsResolve(coll => {
        //     if (coll.isRight()) { this.obj.jump(330); this.obj.applyImpulse(K.vec2(-150, 0)); }
        // });
        // this.obj.onUpdate(() => {
        //     if (this.obj.isGrounded()) this.obj.move(100, 0);
        // })
        if (this.id === "agent") this.speechBubble!.text = "You will be surprised to know that this speech bubble can fill up and word-wrap because I am saying quite a lot of text here!", this.speechBubble!.width = 100;
    }
    unloaded() {
        this.obj = null;
        this.bones = {};
        this.speechBubble = null;
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
                l.pos as XY,
                l.light!.radius,
                l.light!.strength,
                l.light!.color.toHex(),
                [] // TODO: serialize light tags once it's implemented
            ]),
            pos: this.pos as XY,
        }
    }
    update() {
        this.pos = this.obj!.pos.clone();
        // TODO: tick animations
    }
}
