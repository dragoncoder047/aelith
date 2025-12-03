import { AreaComp, AudioPlay, BodyComp, GameObj, KEventController, PosComp, RotateComp, ScaleComp, Vec2 } from "kaplay";
import { LightComp } from "kaplay-lighting";
import { K } from "../context";
import { PAreaComp } from "../context/plugins/kaplay-aabb";
import { EntityData, EntityMoveAnimDef, EntityPrototypeData, LightData, XY } from "../DataPackFormat";
import { JSONObject } from "../JSON";
import * as ScriptHandler from "../script/ScriptHandler";
import { Serializable } from "../Serializable";
import { RangeSetting } from "../settings";
import { SYSTEM_SETTINGS } from "../static/systemMenus";
import { Animator, buildAnimations } from "./Animator";
import { buildHitbox, buildSkeleton } from "./buildSkeleton";
import { EntityComp, entitywrapper } from "./comps/entitywrapper";
import { SpeechBubbleComp } from "./comps/speechBubble";
import * as EntityManager from "./EntityManager";
import { Inventory } from "./Inventory";
import { MotionManager } from "./MotionManager";

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
    motionController: MotionManager;
    inventory: Inventory;
    targeted: Entity | null = null;
    private _updateEv = new K.KEvent;
    private _prototype: EntityPrototypeData;
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
        this._prototype = EntityManager.getEntityPrototypeStrict(kind);
        this.inventory = new Inventory(this);
        buildAnimations(kind, this.animator = new Animator(this));
        this.motionController = new MotionManager(this, this._prototype.model.kinematics.states);
        this.motionController.onStateChange((a, b) => {
            const aa = a?.leaveHook;
            const bb = b.startHook;
            if (aa) this.startHook(aa);
            if (bb) this.startHook(bb);
            this._updateGravityScale(b);
        });
        this.setMotionState(this._prototype.model.kinematics.initial);
        this.startHook("setup");
    }
    startHook(name: string, context: JSONObject = {}): ScriptHandler.Task | null {
        const proto = this.getPrototype();
        var hook = proto.hooks?.[name] as any;
        if (!hook) return null;
        if (Array.isArray(hook)) hook = { impl: hook, priority: 0 };
        return ScriptHandler.spawnTask(hook.priority, hook.impl, this, context);
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
            entitywrapper(self),
            {
                id: "entityroot",
                // run in draw() so after the constraints code and anims can override the constraint
                draw() { self.update(K.dt()); }
            },
            self.id,
            self.kind,
            K.pos(self.pos),
        ]) as any;
        buildHitbox(self, self.obj!);
        if (self.obj!.has("body")) self.obj!.onGround(() => {
            self.startHook("landed", { force: self.obj!.vel.len() });
        });
        self.bones = buildSkeleton(self, self.obj!);
        self.animator.init();
        self.motionController.init();
        self.startHook("load");
        this._updateGravityScale(this.motionController.curData());
        for (const sensor of this.sensors) {
            self.bones[sensor]!.onCollide(obj => self.startHook("sensed", {
                bone: sensor,
                entity: obj.entity ? obj.entity.id : null,
                height: (obj as GameObj<PAreaComp>).aabb().height,
                width: (obj as GameObj<PAreaComp>).aabb().width,
            }));
        }
    }
    getPrototype() {
        return this._prototype;
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
            this.startHook("unload");
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
        const width = K.width() / K.getCamScale().x;
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
        volume *= SYSTEM_SETTINGS.getValue<RangeSetting>("sfxVolume")!;
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
    update(dt: number) {
        this.pos = this.obj!.pos.clone();
        this.animator.update(dt);

        this.motionController.run(dt, this._lastMove, this._sprintSpeed, this._motionStateShouldEnd);
        this._lastMove = K.Vec2.ZERO;
        this._motionStateShouldEnd = false;

        this.inventory.update();
        this._updateEv.trigger();
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
            case EntityInputAction.ACTION6:
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
            case EntityInputAction.ACTION5:
                this.startHook(action, { what: this.targeted?.id });
                break;
            default:
                action satisfies never;
                throw new Error(`wtf what is entity supposed to do with ${action}`);
        }
    }
    tryJump() {
        if (this.obj) {
            this.motionController.jump();
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
            });
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
    private _lastMove = K.Vec2.ZERO;
    private _moving = false;
    private _sprintSpeed = 0;
    setMotionState(state: string) {
        this.motionController.setState(state);
    }
    private _motionStateShouldEnd = false;
    endMotionState() {
        this._motionStateShouldEnd = true;
    }
    private _updateGravityScale(state?: EntityMoveAnimDef) {
        if (this.obj) {
            const os = this.obj.gravityScale;
            const ns = (this.obj.gravityScale = state?.gravityScale ?? 1);
            if (os > 0 && ns === 0) K.Vec2.copy(K.Vec2.ZERO, this.obj.vel);
        }
    }
    doMove(direction: Vec2, sprint: boolean) {
        const pb = this.getPrototype().behavior;
        if (direction.isZero()) sprint = false;
        if (this.motionController.sprinting && !sprint) {
            this.startHook("stopSprint");
        }
        else if (!this.motionController.sprinting && sprint) {
            this.startHook("startSprint");
        }
        const speed = ((this.motionController.sprinting = sprint) ? pb.sprintSpeed : null) ?? pb.moveSpeed;
        if (this.obj) {
            const l = clampUnit(direction);
            this._sprintSpeed = l.len();
            this._lastMove = l.scale(speed);
        }
        if (direction.isZero()) {
            if (this._moving) this.startHook("stopMove");
            this._moving = false;
        } else {
            this._moveLooking = direction.x < 0 ? K.LEFT : K.RIGHT;
            if (!this._moving) this.startHook("startMove");
            this._moving = true;
        }
    }
}

function clampUnit(v: Vec2): Vec2 {
    return v.slen() > 1 ? v.unit() : v;
}
