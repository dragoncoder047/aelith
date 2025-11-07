import { KEventController, Vec2 } from "kaplay";
import { K } from "../context";
import { EntityModelData, EntityMoveAnimDef, EntityMovingBoneData } from "../DataPackFormat";
import { BonesMap, Entity } from "./Entity";

export enum MotionState {
    STOPPED,
    WALKING,
    CLIMBING,
    FLYING,
}

export class MotionManager {
    state: MotionState = -1 as any;
    bases: Record<string, Vec2> = {};
    private _moving: MovingBone[] = [];
    private _stateChange = new K.KEvent;
    sprinting = false;
    constructor(public entity: Entity, public data: EntityModelData["kinematics"]) {
    }
    init() {
        for (var def of ["walk", "climb", "fly", "stand"] as const) {
            for (var bone of (this.data[def]?.bones ?? [])) {
                this.bases[bone.bone] = this.entity!.bones[bone.bone]!.pos.clone();
            }
        }
    }
    onStateChange(a: (from: MotionState, to: MotionState) => void): KEventController {
        return this._stateChange.add(a);
    }
    private _didChangeStateTo(state: MotionState) {
        if (state === this.state) return false;
        this._stateChange.trigger(this.state, state);
        this._ended();
        this.state = state;
        return true;
    }
    private _getData(): [string | undefined, string | undefined, EntityMovingBoneData[], stepLen: number, stepTime: number, stepHeight: number] {
        const d = (x?: EntityMoveAnimDef): [string | undefined, string | undefined, EntityMovingBoneData[], number, number, number] =>
            x ? [x.anim, x.sprint, x.bones ?? [], x.steps?.len ?? 1, x.steps?.height ?? 0, x.steps?.time ?? 0] : [, , [], 1, 0, 0];
        return d(this.data[({
            [MotionState.STOPPED]: "stand",
            [MotionState.WALKING]: "walk",
            [MotionState.CLIMBING]: "climb",
            [MotionState.FLYING]: "fly",
        } as const)[this.state]]);
    }
    private _ended() {
        for (var b of this._moving) {
            this.entity.bones[b.bone]!.pos = this.bases[b.bone]!.clone();
        }
        this._moving = [];
        const [a, s] = this._getData();
        if (a) this.entity.stopAnim(a);
        if (s) this.entity.stopAnim(s);
    }
    setState(state: MotionState) {
        if (this._didChangeStateTo(state)) {
            const [a, s, d, l, h, t] = this._getData();
            if (a) this.entity.playAnim(a);
            if (s) { this.entity.playAnim(s); this.entity.animator.skinAnim(s, 0); }
            this._moving = this._createData(d, l, h, t);
        }
    }
    private _createData(d: EntityMovingBoneData[], len: number, height: number, time: number): MovingBone[] {
        return d.map(({ bone, flip, stepMode }, i) => {
            const b = new MovingBone(bone, this.bases[bone]!, flip, !!stepMode);
            if (stepMode) {
                b.cur = this.entity.bones[bone]!.worldPos()!.clone();
                b.mode = stepMode;
                b.progress = i / d.length;
                b.len = len;
                b.height = height;
                b.time = time;
            }
            return b;
        });
    }
    jump() {
        switch (this.state) {
            case MotionState.STOPPED:
            case MotionState.WALKING:
                if (this.entity.obj?.isGrounded()) {
                    this.setState(MotionState.STOPPED);
                    this.entity.obj!.jump();
                }
                break;
            case MotionState.CLIMBING:
                this.setState(MotionState.STOPPED);
                this.entity.obj!.jump();
                break;
        }
    }
    run(dt: number, d: Vec2, ss: number) {
        switch (this.state) {
            case MotionState.STOPPED:
            case MotionState.WALKING:
                if (!this.entity.obj?.isGrounded() || d.isZero()) {
                    this.setState(MotionState.STOPPED);
                }
                else if (!d.isZero() && this.entity.collidingLadder()) {
                    this.setState(MotionState.CLIMBING);
                }
                else {
                    this.setState(MotionState.WALKING);
                    d = d.reject(K.getGravityDirection());
                    const [_, s] = this._getData();
                    if (s) this.entity.animator.skinAnim(s, this.sprinting ? ss : 0);
                }
                break;
            case MotionState.CLIMBING:
                if (!this.entity.collidingLadder())
                    this.setState(MotionState.STOPPED);
                break;
        }
        for (var i = 0; i < this._moving.length; i++) {
            this._moving[i]!.update(dt, d, this.entity.bones, this.entity.id);
        }
        this.entity.obj!.move(d);
        this.entity.startHook("move", { dir: { x: d.x, y: d.y }, sprinting: this.sprinting });
    }
}

/*

for moving: bones' progress are updated based on the length of the delta vector (which is of
course processed to be only horizontal when walking)

the "step" and "jump" modes of interpolation have the bone stick to the planted position and then "jump"
to the next planted position and follow an interpolation path to do so, step is parabolic and jump is linear
the "free" mode uses cos(2πt) for constant interpolation

*/

class MovingBone {
    private _planted = true;
    private _t = 0;
    constructor(public bone: string,
        public base: Vec2,
        public flip: EntityMovingBoneData["flip"],
        public moving: boolean,
        public cur?: Vec2,
        public next?: Vec2,
        public mode?: EntityMovingBoneData["stepMode"],
        public progress?: number,
        public len?: number,
        public height?: number,
        public time?: number) { }
    _check(which: 1 | -1, ignore: string) {
        const nextX = this.cur!.x | which * this.len!;
        const r = K.raycast(K.vec2(this.cur!.y, nextX), K.DOWN.scale(K.height()), [ignore]);
        if (r) {
            return r.point;
        } else {
            return K.vec2(nextX, this.cur!.y);
        }
    }
    update(dt: number, d: Vec2, b: BonesMap, id: string) {
        const o = b[this.bone]!;
        if (this.flip) {
            const s = this.flip[d.isZero() ? 2 : d.x < 0 ? 0 : 1];
            if (s !== null) o.scaleTo(s ? -1 : 1, 1);
        }
        if (!this.moving) return;
        if (this.mode === "free") {
            o.worldPos(this.base.add(this.height! * Math.cos(this.progress! += Math.PI * 2 * d.len() / this.len!), 0));
        } else {
            this.progress! += d.len() / this.len!;
            if (this._planted) {
                o.worldPos(this.cur);
                if (this.progress! >= 1) {
                    this._t = 0;
                    this._planted = false;
                    this.next = this._check(d.x > 0 ? 1 : -1, id);
                }
            } else {
                const lerpFun = ({ step: stepFunction, jump: K.lerp<Vec2> } as const)[this.mode!];
                o.worldPos(lerpFun(this.cur!, this.next!, this._t, this.height!));
                if ((this._t += dt / this.time!) >= 1) {
                    this._planted = true;
                    this.cur = this.next;
                }
            }
            if (this.progress! >= 1) {
                this.progress = 0;
            }
        }
    }
}

function stepFunction(p0: Vec2, p1: Vec2, progress: number, stepHeight: number) {
    const s = (b: number) => 1 / (1 + Math.sqrt(1 - b));
    const f = (x: number, b: number) => 1 - ((x - s(b)) ** 2) / (s(b) ** 2);
    const y = (a: number, b: number, x: number, h: number) => b < a ? h * f(x, (b - a) / h) + a : h * f(1 - x, (a - b) / h) + b;
    if (stepHeight <= 0) stepHeight = 1e-6;
    return K.vec2(K.lerp(p0.x, p1.x, progress), y(p0.y, p1.y, progress, stepHeight));
}
