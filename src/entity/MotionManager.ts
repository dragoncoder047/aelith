import { KEventController, Vec2 } from "kaplay";
import { K } from "../context";
import { EntityModelData, EntityMoveAnimDef, EntityMovingBoneData } from "../DataPackFormat";
import { BonesMap, Entity } from "./Entity";

export enum MotionState {
    STANDING,
    WALKING,
    CLIMBING,
    FLYING,
    // TODO: swimming
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
            [MotionState.STANDING]: "stand",
            [MotionState.WALKING]: "walk",
            [MotionState.CLIMBING]: "climb",
            [MotionState.FLYING]: "fly",
        } as const)[this.state]]);
    }
    private _ended() {
        for (var b of this._moving) {
            this.entity.bones[b.bone]!.pos = this.bases[b.bone]!.clone();
        }
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
        return d.map(({ bone, flip, stepMode, phaseOffset }) => {
            const b = new MovingBone(bone, flip, !!stepMode, this.state === MotionState.CLIMBING);
            if (stepMode) {
                b.curOffset = (b.offsetFromPlayerPos = this.entity.obj!.fromWorld(this.entity.bones[bone]!.worldPos()!)).add(len * (phaseOffset - 0.5), 0);
                b.mode = stepMode;
                b.len = len;
                b.height = height;
                b.time = time;
            }
            return b;
        });
    }
    jump() {
        switch (this.state) {
            case MotionState.STANDING:
            case MotionState.WALKING:
                if (this.entity.obj?.isGrounded()) {
                    this.setState(MotionState.STANDING);
                    this.entity.obj!.jump();
                    return true;
                }
                break;
            case MotionState.CLIMBING:
                this.setState(MotionState.STANDING);
                this.entity.obj!.jump();
                return true;
        }
        return false;
    }
    run(dt: number, velocity: Vec2, sprintSpeed: number) {
        switch (this.state) {
            case MotionState.STANDING:
            case MotionState.WALKING:
                if (!this.entity.obj?.isGrounded() || velocity.isZero()) {
                    this.setState(MotionState.STANDING);
                }
                else if (!velocity.isZero() && this.entity.collidingLadder()) {
                    this.setState(MotionState.CLIMBING);
                }
                else {
                    this.setState(MotionState.WALKING);
                    velocity = velocity.reject(K.getGravityDirection());
                    const [_, s] = this._getData();
                    if (s) this.entity.animator.skinAnim(s, this.sprinting ? sprintSpeed : 0);
                }
                break;
            case MotionState.CLIMBING:
                if (!this.entity.collidingLadder())
                    this.setState(MotionState.STANDING);
                break;
            case MotionState.FLYING:
                // Do nothing. Flying is only exited manually
                break;
            default:
                this.state satisfies never;
        }
        for (var i = 0; i < this._moving.length; i++) {
            // TODO: pass in index to be able to PLL-lock phase offsets
            this._moving[i]!.update(dt, velocity, this.entity.bones, this.entity.id, this.entity.pos);
        }
        this.entity.obj!.move(velocity);
        this.entity.startHook("move", { dir: { x: velocity.x, y: velocity.y }, sprinting: this.sprinting });
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
    offsetFromPlayerPos?: Vec2
    curOffset?: Vec2
    nextOffset?: Vec2
    mode?: EntityMovingBoneData["stepMode"]
    len?: number
    height?: number
    time?: number
    xoff?: number;
    constructor(public bone: string,
        public flip: EntityMovingBoneData["flip"],
        public moving: boolean,
        // TODO: don't hardcode two of them
        public ladderMode: boolean) { }
    update(dt: number, motionSpeed: Vec2, b: BonesMap, id: string, playerRootPos: Vec2) {
        // what the heck
        const o = b[this.bone]!;
        const delta = motionSpeed.len() / this.len! * dt;
        if (this.flip) {
            // TODO: flipping bounds on 
            const s = this.flip[motionSpeed.isZero() ? 2 : motionSpeed.x < 0 ? 0 : 1];
            if (s !== null) o.scaleTo(s ? -1 : 1, 1);
        }
        if (!this.moving) return;
        const moveFootToOffset = (offset: Vec2) => {
            o.worldPos(this.offsetFromPlayerPos!.add(offset.add(playerRootPos)));
        };
        if (this.mode === "free") {
            moveFootToOffset(K.vec2(this.height! * Math.cos(this._t! += Math.PI * 2 * delta), 0));
        } else {
            K.Vec2.addScaled(this.curOffset!, motionSpeed, -dt, this.curOffset!);
            if (this._planted) {
                moveFootToOffset(this.curOffset!);
                if (this.curOffset!.slen() > (this.len! ** 2)) {
                    this._t = 0;
                    this._planted = false;
                    this.nextOffset ??= K.vec2();
                    if (this.ladderMode) {
                        // TODO:
                    } else {
                        // TODO:
                    }
                }
            } else {
                const lerpFun = ({ step: stepFunction, jump: K.lerp<Vec2> } as const)[this.mode!];
                moveFootToOffset(lerpFun(this.curOffset!, this.nextOffset!, this._t, this.height!));
                if ((this._t += dt / this.time!) >= 1) {
                    this._planted = true;
                    K.Vec2.copy(this.nextOffset!, this.curOffset!);
                }
            }
        }
    }
}

function stepFunction(p0: Vec2, p1: Vec2, progress: number, stepHeight: number) {
    const s = (b: number) => 1 / (1 + Math.sqrt(1 - b));
    const f = (x: number, b: number) => ((x - s(b)) ** 2) / (s(b) ** 2) - 1;
    const y = (a: number, b: number, x: number, h: number) => b < a ? h * f(1 - x, (b - a) / h) + b : h * f(x, (a - b) / h) + a;
    if (stepHeight <= 0) stepHeight = 1e-6; // prevent divide by 0
    return K.vec2(K.lerp(p0.x, p1.x, progress), y(p0.y, p1.y, progress, stepHeight));
}
