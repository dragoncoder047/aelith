import { Comp, GameObj, PosComp, RotateComp, ScaleComp, Vec2 } from "kaplay";
import { LightComp } from "kaplay-lighting";
import { K } from "../context";
import { EntityData, LightData, XY } from "../DataPackFormat";
import { JSONObject } from "../JSON";
import { Serializable } from "../Serializable";
import { EntityAnimation } from "./Animation";
import { buildHitbox, buildSkeleton } from "./buildSkeleton";
import { SpeechBubbleComp } from "./comps/speechBubble";
import * as EntityManager from "./EntityManager";

export interface EntityComp extends Comp {
    readonly entity: Entity;
}

export enum EntityInputAction {
    ACTION1 = "action1",
    ACTION2 = "action2",
    ACTION3 = "action3",
    ACTION4 = "action4",
    TARGET1 = "target1",
    TARGET2 = "target2",
    INSPECT = "inspect",
    CONTINUE = "continue",
}

export type EntityComponents = EntityComp | PosComp;
export type BoneComponents = EntityComponents | RotateComp | ScaleComp;
export type BonesMap = Record<string, GameObj<BoneComponents>>;

export class Entity implements Serializable {
    obj: GameObj<EntityComponents> | null = null;
    bones: BonesMap = {};
    speechBubble: GameObj<SpeechBubbleComp> | null = null;
    speakSound: string | undefined;
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
    private _speechCanceler: AbortController | undefined;
    async say(text: string | undefined) {
        if (!text) this.speechBubble && (this.speechBubble.text = "");
        else {
            await this.speechBubble?.speakText(text, undefined /* TODO */, (this._speechCanceler = new AbortController()).signal);
            this._speechCanceler = undefined;
        }
    }

    doAction(action: EntityInputAction, context: Entity) {
        switch (action) {
            case EntityInputAction.ACTION1:
            case EntityInputAction.ACTION2:
            case EntityInputAction.ACTION3:
            case EntityInputAction.ACTION4:
            case EntityInputAction.TARGET1:
            case EntityInputAction.TARGET2:
            case EntityInputAction.INSPECT:
                EntityManager.startHookOnEntity(this, action, { what: context.id });
                break;
            case EntityInputAction.CONTINUE:
                this._speechCanceler?.abort();
                break;
            default:
                action satisfies never;
        }
    }
}
