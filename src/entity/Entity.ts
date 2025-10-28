import { BodyComp, Comp, GameObj, KEventController, PosComp, RotateComp, ScaleComp, Vec2 } from "kaplay";
import { LightComp } from "kaplay-lighting";
import { K } from "../context";
import { PAreaComp } from "../context/plugins/kaplay-aabb";
import { EntityData, LightData, XY } from "../DataPackFormat";
import { JSONObject } from "../JSON";
import { Serializable } from "../Serializable";
import { Animator, buildAnimations } from "./Animator";
import { buildHitbox, buildSkeleton } from "./buildSkeleton";
import { SpeechBubbleComp } from "./comps/speechBubble";
import * as EntityManager from "./EntityManager";
import { Inventory } from "./Inventory";

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
    obj: GameObj<EntityComponents | BodyComp> | null = null;
    bones: BonesMap = {};
    speechBubble: GameObj<SpeechBubbleComp> | null = null;
    speakSound: string | undefined;
    lightObjs: GameObj<PosComp | LightComp>[] = [];
    animator: Animator;
    inventory: Inventory;
    targeted: Entity | null = null;
    private _climbing = false;
    constructor(
        public id: string,
        public currentRoom: string | null,
        public kind: string,
        public state: JSONObject,
        public pos: Vec2,
        public leashed: [string, number] | undefined,
        public linkGroup: string | undefined,
        public lights: LightData[]
    ) {
        this.inventory = new Inventory(this);
        buildAnimations(kind, this.animator = new Animator(this));
        EntityManager.startHookOnEntity(this, "setup", {});
    }
    private _unloadedBySceneChange: KEventController | undefined;
    load() {
        if (this.obj) return;
        // needed for the entity getter on entity comp so I used it everywhere for extra minification ;)
        const self = this;
        self._unloadedBySceneChange?.cancel();
        self._unloadedBySceneChange = K.onSceneLeave(() => {
            self.unloaded();
        });
        self.obj = K.add([
            {
                id: "entity",
                get entity() { return self; },
                // run in draw() so after the constraints code and anims can override the constraint
                draw() { self.update(); }
            } as EntityComp,
            self.id,
            self.kind,
            K.pos(self.pos),
        ]) as any;
        buildHitbox(self, self.obj!);
        self.bones = buildSkeleton(self, self.obj!);
        EntityManager.startHookOnEntity(self, "load", {});
    }
    getPrototype() {
        return EntityManager.getEntityPrototypeStrict(this.kind);
    }
    setPosition(pos: Vec2) {
        if (this.obj) this.obj.pos = pos;
        else this.pos = pos;
    }
    destroy() {
        this.obj?.destroy();
        for (var k of Object.keys(this.bones)) {
            this.bones[k]?.destroy();
        }
        this._unloadedBySceneChange?.cancel();
        this.unloaded();
    }
    unloaded() {
        if (this.obj) {
            this.bones = {};
            this.obj = this.speechBubble = null;
            this.lightObjs = [];
            EntityManager.startHookOnEntity(this, "unload", {});
        }
        this._goOn = this._shutUp = this._unloadedBySceneChange = undefined;
        this._spitItOut = false;
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
    playAnim(a: string) {
        return new Promise<void>((x, y) => {
            try {
                this.animator.play(a, x)
            } catch (e) { y(e); }
        });
    }
    stopAnim(a: string) {
        this.animator.stop(a);
    }
    update() {
        this.pos = this.obj!.pos.clone();
        this.animator.update(K.dt());
        this.inventory.update();
    }
    private _spitItOut = false;
    private _goOn: (() => void) | undefined;
    private _shutUp: (() => void) | undefined;
    async say(text: string | undefined) {
        if (!text) this.speechBubble && (this.speechBubble.text = "", this._spitItOut = false);
        else {
            this._shutUp?.();
            await this.speechBubble?.speakText(text,
                () => new Promise((a, b) => (this._goOn = a, this._shutUp = () => (this._spitItOut = true, b(true)))),
                undefined /* TODO: play this.speakSound on self's location */,
                () => (this._spitItOut ? (this._spitItOut = false, true) : false));
        }
    }

    doAction(action: EntityInputAction) {
        switch (action) {
            case EntityInputAction.ACTION1:
            case EntityInputAction.ACTION2:
            case EntityInputAction.ACTION3:
            case EntityInputAction.ACTION4:
            case EntityInputAction.TARGET1:
            case EntityInputAction.TARGET2:
            case EntityInputAction.INSPECT:
                EntityManager.startHookOnEntity(this, action, { what: this.targeted?.id });
                break;
            case EntityInputAction.CONTINUE:
                if (!this.speechBubble?.isSpeaking()) {
                    if (this.speechBubble) this.speechBubble.text = "";
                }
                else if (this._goOn) {
                    this._goOn();
                    this._goOn = undefined;
                }
                else this._spitItOut = true;
                break;
            default:
                action satisfies never;
                throw new Error(`wtf what is entity supposed to do with ${action}`);
        }
    }
    tryJump() {
        if (this.obj) {
            if (this.obj.isGrounded()) {
                this.obj.jump();
                EntityManager.startHookOnEntity(this, "jump");
            }
        }
    }
    getHead(): GameObj<PosComp> | undefined {
        return this.bones[this.getPrototype().model.kinematics.look.origin];
    }
    target(other: Entity | null) {
        if (other?.obj) {
            this._lookAtPoint(other.obj.worldPos()!);
        }
        this.targeted = other;
        if (other) {
            const bbox = (other.obj as any).aabb();
            K.drawRect({
                width: bbox.width,
                height: bbox.height,
                pos: bbox.pos,
                fill: false,
                outline: {
                    width: 2,
                    color: K.RED
                }
            })
        }
    }
    private _lookAtPoint(pt: Vec2) {
        if (this.obj) {
            const d = this.getPrototype().model.kinematics.look;
            this.bones[d.target]!.worldPos(pt);
        }
    }
    lookInDirection(direction: Vec2) {
        const lookRelToHead = (pt: Vec2) => {
            this._lookAtPoint(this.getHead()!.worldPos()!.add(pt));
        }
        if (this.obj && !direction.isZero()) {
            const d = this.getPrototype().model.kinematics.look;
            const origin = this.bones[d.origin]!.worldPos()!;
            const res = K.raycast(origin, direction.scale((this.getPrototype().behavior.interactDistance ?? 4) * 32), [this.id]);
            if (res) {
                if (!(res.object?.entity) && res.point) this._lookAtPoint(res.point);
            } else {
                lookRelToHead((direction.slen() < 1 ? direction.unit() : direction).scale(128));
            }
            this.target(res?.object?.entity as Entity);
            return res;
        } else {
            // reset gaze to normal
            lookRelToHead(K.RIGHT.scale(128));
        }
        return null;
    }
    doMove(direction: Vec2, sprint?: boolean) {
        EntityManager.startHookOnEntity(this, "move", { dir: { x: direction.x, y: direction.y }, sprint });
        const pb = this.getPrototype().behavior;
        const speed = (sprint ? pb.sprintSpeed : null) ?? pb.moveSpeed;
        if (this.obj) {
            this.obj.move(direction.unit().scale(speed));
            this._motionAnimation(direction, sprint);
        }
    }
    private _motionAnimation(direction: Vec2, sprint?: boolean) {

    }
}
