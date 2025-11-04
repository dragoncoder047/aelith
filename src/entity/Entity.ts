import { AreaComp, AudioPlay, BodyComp, Comp, GameObj, KEventController, PosComp, RotateComp, ScaleComp, Vec2 } from "kaplay";
import { LightComp } from "kaplay-lighting";
import { K } from "../context";
import { PAreaComp } from "../context/plugins/kaplay-aabb";
import { EntityData, EntityModelData, LightData, XY } from "../DataPackFormat";
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
export type BoneComponents = EntityComponents | RotateComp | ScaleComp | AreaComp;
export type BonesMap = Record<string, GameObj<BoneComponents>>;

export class Entity implements Serializable {
    obj: GameObj<EntityComponents | BodyComp | AreaComp> | null = null;
    bones: BonesMap = {};
    sensors = new Set<string>();
    speechBubble: GameObj<SpeechBubbleComp> | null = null;
    speakSound: string | undefined;
    lightObjs: GameObj<PosComp | LightComp>[] = [];
    animator: Animator;
    inventory: Inventory;
    targeted: Entity | null = null;
    private _updateEv = new K.KEvent;
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

    onUpdate(cb: () => void): KEventController {
        return this._updateEv.add(cb);
    }
    private _unloadedBySceneChange: KEventController | undefined;
    load() {
        // needed for the entity getter on entity comp so I used it everywhere for extra minification ;)
        const self = this;
        if (self.obj) return;
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
        self.obj!.onGround(() => {
            EntityManager.startHookOnEntity(self, "landed", { force: self.obj!.vel.len() });
        });
        self.bones = buildSkeleton(self, self.obj!);
        self.animator.init();
        EntityManager.startHookOnEntity(self, "load", {});
        for (const sensor of this.sensors) {
            self.bones[sensor]!.onCollide(obj => EntityManager.startHookOnEntity(self, "sensed", {
                bone: sensor,
                entity: obj.entity ? obj.entity.id : null,
                height: (obj as GameObj<PAreaComp>).aabb().height,
                width: (obj as GameObj<PAreaComp>).aabb().width,
            }));
        }
    }
    getPrototype() {
        return EntityManager.getEntityPrototypeStrict(this.kind);
    }
    setPosition(pos: Vec2) {
        this.pos = pos;
        if (this.obj) this.obj.pos = pos;
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
        this._updateEv.trigger();
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
    private _ongoingSounds: [AudioPlay, number][] = [];
    private _getPanVol(masterVolume: number) {
        const player = EntityManager.getPlayer()!;
        const playerPos = player.pos;
        const worldPos = this.pos;
        const width = K.width() / K.getCamScale().x
        const halfwidth = width / 2;
        const distance = worldPos.sub(playerPos).len();
        const volume = this.currentRoom === player.currentRoom ? K.mapc(distance - halfwidth * Math.sign(distance), 0, halfwidth, masterVolume, 0) : 0;
        const xDiff = worldPos.x - playerPos.x;
        const pan = K.mapc(xDiff, -halfwidth, halfwidth, -1, 1);
        return { pan, volume };
    }
    private _updateSounds() {
        for (var i = 0; i < this._ongoingSounds.length; i++) {
            const [sound, volume] = this._ongoingSounds[i]!;
            if (sound.time() >= sound.duration()) {
                sound.stop();
                // No need to splice, order doesn't matter
                this._ongoingSounds[i--] = this._ongoingSounds.pop()!;
            } else {
                Object.assign(sound, this._getPanVol(volume));
            }
        }
    }
    emitSound(sound: string, volume: number) {
        const a = K.play(sound, this._getPanVol(volume));
        this._ongoingSounds.push([a, volume]);
    }
    playAnim(a: string, forceRestart: boolean = true) {
        return new Promise<void>((x, y) => {
            try {
                this.animator.play(a, x, forceRestart)
            } catch (e) { y(e); }
        });
    }
    stopAnim(a: string) {
        this.animator.stop(a);
    }
    private _collidingLadder() {
        return this.obj!.getCollisions().some(c => c.target.is("ladder"));
    }
    update() {
        this.pos = this.obj!.pos.clone();
        this.animator.update(K.dt());
        this.inventory.update();
        this._updateEv.trigger();
        if (!this._collidingLadder()) this._setClimbing(false);

        this._updateSounds();
    }
    private _spitItOut = false;
    private _goOn: (() => void) | undefined;
    private _shutUp: (() => void) | undefined;
    async say(text: string | undefined) {
        if (!text) this.speechBubble && (this.speechBubble.text = "", this._spitItOut = false);
        else {
            this._shutUp?.();
            await this.speechBubble?.speakText(text,
                () => new Promise((a, b) => (this._goOn = a, this._shutUp = () => b(this._spitItOut = true))),
                () => this.speakSound && this.emitSound(this.speakSound, 1),
                () => (this._spitItOut ? (this._spitItOut = false, true) : false));
        }
    }

    doAction(action: EntityInputAction) {
        switch (action) {
            // @ts-expect-error
            case EntityInputAction.CONTINUE:
                if (!this.speechBubble?.isSpeaking()) {
                    if (this.speechBubble) this.speechBubble.text = "";
                }
                else if (this._goOn) {
                    this._goOn();
                    this._goOn = undefined;
                }
                else this._spitItOut = true;
            case EntityInputAction.ACTION1:
            case EntityInputAction.ACTION2:
            case EntityInputAction.ACTION3:
            case EntityInputAction.ACTION4:
            case EntityInputAction.TARGET1:
            case EntityInputAction.TARGET2:
            case EntityInputAction.INSPECT:
                EntityManager.startHookOnEntity(this, action, { what: this.targeted?.id });
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
                this._setClimbing(false);
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
        // TODO: remove this debugging rectangle
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
    private _moveLooking: Vec2 = K.RIGHT;
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
            lookRelToHead(this._moveLooking.scale(128));
        }
        return null;
    }
    private _sprinting = false;
    private _walking = false;
    private _climbing = false;
    private _setClimbing(isClimbing: boolean) {
        this._climbing = isClimbing;
        if (!this.obj) return;
        if (isClimbing) {
            this.obj.gravityScale = 0;
        } else if (!this.getPrototype().behavior.canFly) {
            this.obj.gravityScale = 1;
        }
    }
    doMove(direction: Vec2, sprint: boolean) {
        const p = this.getPrototype();
        const pb = p.behavior;
        const pk = p.model.kinematics;
        if (direction.isZero()) sprint = false;
        if (this._sprinting && !sprint) {
            EntityManager.startHookOnEntity(this, "stopSprint");
            if (pk.sprint) this.stopAnim(pk.sprint);
        }
        else if (!this._sprinting && sprint) {
            EntityManager.startHookOnEntity(this, "startSprint");
            if (pk.sprint) this.playAnim(pk.sprint);
        }
        this._sprinting = sprint;
        if (direction.isZero()) {
            if (this._walking) EntityManager.startHookOnEntity(this, "stopMove");
            this._walking = false;
            return;
        }
        if (!this._walking) {
            EntityManager.startHookOnEntity(this, "startMove", { dir: { x: direction.x, y: direction.y }, sprinting: sprint });
        }
        this._walking = true;
        EntityManager.startHookOnEntity(this, "move", { dir: { x: direction.x, y: direction.y }, sprinting: sprint });
        const speed = (this._sprinting ? pb.sprintSpeed : null) ?? pb.moveSpeed;
        if (this.obj) {
            if (this._collidingLadder()) this._setClimbing(true);
            if (!this._climbing && !pb.canFly) direction = direction.reject(K.getGravityDirection());
            direction = clampUnit(direction).scale(speed);
            this.obj.move(direction);
            this._motionAnimation(direction, pk);
            if (pk.sprint) {
                this.animator.skinAnim(pk.sprint, this._sprinting ? direction.len() : 0);
            }
        }
    }
    private _motionAnimation(direction: Vec2, m: EntityModelData["kinematics"]) {
        const a = (this._climbing ? m.climb : m.walk) ?? [];
        const isLeft = direction.x < 0;
        const isHorizontal = direction.x !== 0;
        for (var anim of a) {
            const b = this.bones[anim.bone]!;
            if (isHorizontal)
                b.scaleTo(anim.flip?.[isLeft ? 0 : 1] ? 1 : -1, 1);
        }
        if (isHorizontal)
            this._moveLooking = isLeft ? K.LEFT : K.RIGHT;
    }
}

function clampUnit(v: Vec2): Vec2 {
    return v.slen() > 1 ? v.unit() : v;
}
