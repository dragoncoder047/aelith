import { AreaComp, AudioPlay, BodyComp, GameObj, KEventController, PosComp, RotateComp, ScaleComp, Vec2 } from "kaplay";
import { LightComp } from "kaplay-lighting";
import { K } from "../context";
import { EntityData, EntityMoveAnimDef, EntityPrototypeData, XY } from "../DataPackFormat";
import { JSONObject } from "../JSON";
import * as ScriptHandler from "../script/ScriptHandler";
import { Serializable } from "../Serializable";
import { RangeSetting } from "../settings";
import { SYSTEM_SETTINGS } from "../static/systemMenus";
import { Animator, buildAnimations } from "./Animator";
import { buildHitbox, buildSkeleton } from "./buildSkeleton";
import { EntityComp, entitywrapper } from "./comps/entitywrapper";
import { segment, SpeechBubbleComp } from "./comps/speechBubble";
import { DisplayEntity } from "./DisplayEntity";
import * as EntityManager from "./EntityManager";
import { Inventory } from "./Inventory";
import { MotionManager } from "./MotionManager";

export type EntityComponents = EntityComp | PosComp;
export type BoneComponents = EntityComponents | RotateComp | ScaleComp | AreaComp;
export type BonesMap = Record<string, GameObj<BoneComponents>>;

enum SpeechBubbleAction {
    ADD_WORD, // +word, play sound, and wait
    CLEAR_BUBBLE, // clear screen
    FINISH_SENTENCE, // wait,
    FINISH_SPEAKING, // resolve promise, and clear if nothing else to say
}

type SpeechBubbleQueueEntry = [SpeechBubbleAction, string | undefined, (() => void) | undefined];

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
    private _updateLoop: KEventController;
    constructor(
        public id: string,
        public currentRoom: string | null,
        public kind: string,
        public state: JSONObject,
        public pos: Vec2,
        public leashed: [string, number] | undefined,
        public linkGroup: string | undefined
    ) {
        const p = this._prototype = EntityManager.getEntityPrototypeStrict(kind);
        this.inventory = new Inventory(this);
        buildAnimations(kind, this.animator = new Animator(this));
        this.motionController = new MotionManager(this, p.model?.kinematics?.states);
        this.motionController.onStateChange((a, b) => {
            const aa = a?.leaveHook;
            const bb = b.startHook;
            if (aa) this.startHook(aa);
            if (bb) this.startHook(bb);
            this._updateGravityScale(b);
        });
        this.setMotionState(p.model?.kinematics?.initial ?? null);
        this.startHook("setup");
        this._updateLoop = K.app.onUpdate(() => {
            this.updateHook();
        });
    }
    startHook(name: string, context: JSONObject = {}, exclusive = false): ScriptHandler.Task | null {
        const proto = this.getPrototype();
        var hook = proto.hooks?.[name] as any;
        if (!hook) return null;
        if (Array.isArray(hook)) hook = { impl: hook, priority: 0 };
        return ScriptHandler.addTask(name, hook.priority, hook.impl, this, context, exclusive);
    }

    onUpdate(cb: () => void): KEventController {
        return this._updateEv.add(cb);
    }
    protected _unloadedBySceneChange: KEventController | undefined;
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
                update() { self.drawHook(K.dt()); }
            },
            self.id,
            self.kind,
            K.pos(self.pos),
        ]) as any;
        buildHitbox(self, self.obj!);
        if (self.obj!.has("body")) {
            self.obj!.onGround(() => {
                self.startHook("landed", { force: self.obj!.vel.len() });
            });
        }
        self.bones = buildSkeleton(self, self.obj!);
        self.animator.init();
        self.motionController.init();
        self.startHook("load");
        this._updateGravityScale(this.motionController.curData());
        for (const sensor of this.sensors) {
            self.bones[sensor]!.onCollide(obj => self.startHook("sensed", {
                bone: sensor,
                entity: obj.entity ? obj.entity.id : null,
                height: (obj as GameObj<AreaComp>).worldBbox().height,
                width: (obj as GameObj<AreaComp>).worldBbox().width,
            }));
        }
        this._ongoingSounds.forEach(({ a }) => a.paused = false);
    }
    getPrototype() {
        return this._prototype;
    }
    setPosition(pos: Vec2) {
        this.pos = pos;
        if (this.obj) this.obj.pos = pos;
    }
    destroy() {
        if (!EntityManager.destroyEntity(this)) {
            this.unload();
            ScriptHandler.endTasksBy(this);
            this._updateLoop.cancel();
        }
    }
    unload() {
        this.obj?.destroy();
        for (var b of Object.values(this.bones)) {
            if (b.exists()) b.destroy();
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
        this._updateEv.trigger();
        this._stopEnvironmentalSounds();
        this._ongoingSounds.forEach(({ a }) => a.paused = true);
    }
    toJSON(): EntityData {
        return {
            id: this.id,
            kind: this.kind,
            state: this.state,
            leashed: this.leashed,
            pos: this.pos as XY,
        }
    }
    private _ongoingSounds: { n: string, a: AudioPlay, v: number, g: boolean, e: boolean, f: (() => void) | undefined }[] = [];
    private _getPanVol(masterVolume: number, global = false) {
        masterVolume *= SYSTEM_SETTINGS.getValue<RangeSetting>("sfxVolume")!;
        if (global) return { volume: masterVolume };
        const player = EntityManager.getPlayer()!;
        if (!player) return { volume: masterVolume, pan: 0 };
        const playerPos = player.pos;
        const worldPos = this.pos;
        const width = K.width() / K.getCamScale().x;
        const halfwidth = width / 2;
        const distance = worldPos.sub(playerPos).len();
        const volume = this.currentRoom === player.currentRoom ? K.mapc(distance - halfwidth, 0, halfwidth, masterVolume, 0) : 0;
        const xDiff = worldPos.x - playerPos.x;
        const pan = K.mapc(xDiff, -halfwidth, halfwidth, -1, 1);
        return { pan, volume };
    }
    private _updateSounds() {
        for (var i = 0; i < this._ongoingSounds.length; i++) {
            const { a: sound, v: volume, g: global, f: finished } = this._ongoingSounds[i]!;
            if (sound.time() >= sound.duration()) {
                // No need to splice, order doesn't matter
                this._ongoingSounds.splice(i, 1);
                i--;
                finished?.();
            } else {
                const { pan, volume: vol } = this._getPanVol(volume, global);
                if (!global) sound.pan = pan;
                sound.volume = vol;
            }
        }
    }
    modSound<T extends keyof AudioPlay>(name: string, param: T, value: AudioPlay[T]) {
        this._ongoingSounds.forEach(snd => {
            if (snd.n === name) {
                if (param === "volume") {
                    snd.v = value as number;
                } else {
                    if (param === "pan" && !snd.g) {
                        throw new Error("can only manually change pan on global sounds");
                    }
                    snd.a[param] = value;
                }
            }
        });
    }
    emitSound(sound: string, volume = 1, global = false, environmental = false, onEnd?: () => void) {
        const audioPlay = K.play(sound, this._getPanVol(volume));
        this._ongoingSounds.push({ n: sound, a: audioPlay, v: volume, g: global, e: environmental, f: onEnd });
    }
    private _stopEnvironmentalSounds() {
        for (var i = 0; i < this._ongoingSounds.length; i++) {
            const snd = this._ongoingSounds[i]!;
            if (snd.e) {
                snd.a.stop();
                snd.f?.();
                this._ongoingSounds.splice(i, 1);
                i--;
            }
        }
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
    private _sbQ: SpeechBubbleQueueEntry[] = [];
    private _sbT = 0;
    private _sbTxt = "";
    speechTokenDelay = 0.1;
    speechSentenceDelay = 2;
    private _updateSpeechBubble() {
        if (this._sbT > 0) {
            this._sbT -= K.dt();
            return;
        }
        const action = this._sbQ.shift();
        if (!action) return;
        action[2]?.();
        switch (action[0]) {
            case SpeechBubbleAction.ADD_WORD:
                this._sbTxt += action[1]!;
                this._sbT = this.speechTokenDelay;
                if (this.speakSound) this.emitSound(this.speakSound, 1);
                break;
            case SpeechBubbleAction.FINISH_SENTENCE:
                this._sbTxt = action[1]!;
                this._sbT = this.speechSentenceDelay;
                break;
            case SpeechBubbleAction.CLEAR_BUBBLE:
                this._sbTxt = "";
        }
        if (this.speechBubble) this.speechBubble.text = this._sbTxt;
    }
    updateHook() {
        const other = this.targeted;
        if (other && other?.obj) {
            this._lookAtPoint(other.getHead()?.worldPos ?? other.obj.worldPos);
        }
        this.inventory.update();
        this.startHook("update");
    }
    readonly deltaPos: Vec2 = K.vec2();
    drawHook(dt: number) {
        const newPos = this.obj!.worldPos.clone();
        K.Vec2.sub(newPos, this.pos, this.deltaPos);
        this.pos = newPos;
        this.animator.update(dt);

        this.motionController.run(dt, this._lastMove, this._sprintSpeed, this._motionStateShouldEnd);
        this._lastMove = K.Vec2.ZERO;
        this._motionStateShouldEnd = false;

        this._updateEv.trigger();
        this._updateSounds();
        this._updateSpeechBubble();
        this.startHook("render");
    }
    say(text: string | undefined, force = false) {
        if (!text) {
            this._sbQ.length = this._sbT = 0;
            this._sbTxt = "";
            return Promise.resolve();
        }
        if (force) this._sbQ.length = this._sbT = 0;
        const s = K.sub(text).trim();
        const sentences = segment(s, "sentence");
        const { promise, resolve } = Promise.withResolvers<void>();
        for (var i = 0; i < sentences.length; i++) {
            const sentence = sentences[i]!;
            this._sbTxt = "";
            const sen = sentence.segment.trim();
            if (!sen) continue;
            this._sbQ.push([SpeechBubbleAction.CLEAR_BUBBLE, , ,]);
            const words = segment(sen, "word");
            for (var word of words) {
                this._sbQ.push([SpeechBubbleAction.ADD_WORD, word.segment, ,]);
            }
            this._sbQ.push([SpeechBubbleAction.FINISH_SENTENCE, sen, ,]);
        }
        this._sbQ.push([SpeechBubbleAction.CLEAR_BUBBLE, , resolve])
        return promise;
    }
    doAction(action: string) {
        this.startHook(action, { what: this.targeted?.id }, true);
    }
    tryJump() {
        if (this.obj) {
            this.motionController.jump();
        }
    }
    getHead(): GameObj<PosComp> {
        const b = this.getPrototype().model?.kinematics?.look.origin;
        return b ? this.bones[b]! : this.obj!;
    }
    target(other: Entity | null) {
        this.targeted = other;
    }
    private _lookAtPoint(pt: Vec2) {
        const d = this.getPrototype().model?.kinematics?.look;
        if (this.obj && d) {
            this.bones[d.target]!.worldPos = pt;
        }
    }
    private _moveLooking: Vec2 = K.RIGHT;
    lookInDirection(direction: Vec2) {
        const lookRelToHead = (pt: Vec2) => {
            this._lookAtPoint(this.getHead()!.worldPos.add(pt));
        }
        if (this.obj && !direction.isZero()) {
            const d = this.getPrototype().model?.kinematics?.look;
            const origin = (d ? this.bones[d.origin] : this.obj)!.worldPos;
            const res = K.raycast(origin, direction.scale((this.getPrototype().behavior?.interactDistance ?? 4) * 32), [this.id]);
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
    setMotionState(state: string | null) {
        this.motionController.setState(state);
    }
    private _motionStateShouldEnd = false;
    endMotionState() {
        this._motionStateShouldEnd = true;
    }
    protected _updateGravityScale(state?: EntityMoveAnimDef) {
        if (this.obj) {
            const os = this.obj.gravityScale;
            const ns = (this.obj.gravityScale = state?.gravityScale ?? 1);
            if (os > 0 && ns === 0) K.Vec2.copy(K.Vec2.ZERO, this.obj.vel);
            for (var bone of Object.keys(this.bones)) {
                const b = this.bones[bone] as any;
                if (b.has("body")) {
                    b.gravityScale = ns;
                    if (os > 0 && ns === 0) K.Vec2.copy(K.Vec2.ZERO, b.vel);
                }
            }
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
        const speed = ((this.motionController.sprinting = sprint) ? pb?.sprintSpeed : null) ?? pb?.moveSpeed;
        if (this.obj) {
            const l = clampUnit(direction);
            this._sprintSpeed = l.len();
            this._lastMove = l.scale(speed ?? 1);
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
    toDisplayEntity(): DisplayEntity {
        return new DisplayEntity(this.kind, this.pos, this.state);
    }

    private _smoothing: Record<string, number> = {};
    smoothing(id: string, newValue: number, alpha: number = 20) {
        this._smoothing[id] = K.lerp(this._smoothing[id] ?? newValue, newValue, K.clamp(K.dt() * Math.LN2 * alpha, 0, 1));
        return this._smoothing[id];
    }
}

function clampUnit(v: Vec2): Vec2 {
    return v.slen() > 1 ? v.unit() : v;
}
