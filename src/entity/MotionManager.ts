import { KEventController, Vec2 } from "kaplay";
import { K } from "../context";
import { EntityModelData, EntityMotionStateMachineDef, EntityMoveAnimDef, EntityMovingBoneData } from "../DataPackFormat";
import { BonesMap, Entity } from "./Entity";

export class MotionManager {
    state: string = null as any;
    bases: Record<string, Vec2> = {};
    private _moving: MovingBone[] = [];
    private _stateChange = new K.KEvent<[EntityMoveAnimDef | null, EntityMoveAnimDef]>();
    sprinting = false;
    constructor(public entity: Entity, public data: Record<string, EntityMoveAnimDef>) {
    }
    init() {
        for (var def of Object.keys(this.data)) {
            for (var bone of (this.data[def]?.bones ?? [])) {
                this.bases[bone.bone] = this.entity!.bones[bone.bone]!.pos.clone();
            }
        }
    }
    onStateChange(a: (from: EntityMoveAnimDef | null, to: EntityMoveAnimDef) => void): KEventController {
        return this._stateChange.add(a);
    }
    private _didChangeStateTo(state: string) {
        if (state === this.state) return false;
        this._stateChange.trigger(this.curData() ?? null, this.data[state]!);
        this._ended();
        this.state = state;
        return true;
    }
    curData() {
        return this.data[this.state];
    }
    private _getData(): [string | undefined, string | undefined, boolean, EntityMovingBoneData[], stepLen: number, stepTime: number, stepHeight: number] {
        const x = this.curData();
        return x ? [x.anim, x.sprint, x.gravityScale === 0, x.bones ?? [], x.steps?.len ?? 1, x.steps?.height ?? 0, x.steps?.time ?? 0] : [, , false, [], 1, 0, 0];
    }
    private _ended() {
        for (var b of this._moving) {
            this.entity.bones[b.bone]!.pos = this.bases[b.bone]!.clone();
        }
        const [a, s] = this._getData();
        if (a) this.entity.stopAnim(a);
        if (s) this.entity.stopAnim(s);
    }
    setState(state: string) {
        if (this._didChangeStateTo(state)) {
            const [a, s, c, d, l, h, t] = this._getData();
            if (a) this.entity.playAnim(a);
            if (s) { this.entity.playAnim(s); this.entity.animator.skinAnim(s, 0); }
            this._moving = this._createData(d, c, l, h, t);
        }
    }
    private _createData(d: EntityMovingBoneData[], climbMode: boolean, len: number, height: number, time: number): MovingBone[] {
        return d.map(({ bone, flip, stepMode, phaseOffset }) => {
            const b = new MovingBone(bone, flip, !!stepMode, climbMode);
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
    private _evaluateCondition(cond: EntityMotionStateMachineDef, moving: boolean, manualStop: boolean): boolean {
        if (cond === undefined) return false;
        if (typeof cond[0] === "number") {
            var truthTab = cond[0];
            for (var i = cond.length - 2; i >= 0; i--) {
                // i: 4, 3, 2, 1, 0
                const shift = 1 << i; // 16, 8, 4, 2, 1 : number of bits in the half of the table
                const mask = (1 << shift) - 1; // 65535, 255, 15, 3, 1 : bit mask for these bits
                if (this._evaluateCondition((cond as EntityMotionStateMachineDef[])[i + 1]!, moving, manualStop))
                    truthTab >>>= shift;
                truthTab &= mask;
                if (!truthTab) return false;
                if (truthTab === mask) return true;
            }
            // fallback (reachable only when no conditions / constant rule)
            return !!truthTab;
        }
        switch (cond[0]) {
            case "grounded":
                return this.entity.obj!.isGrounded();
            case "moving":
                return moving;
            case "colliding":
                return this.entity.obj!.getCollisions().some(({ target }) => target.is(cond.slice(1), "and"));
            case "manual":
                return manualStop;
            default:
                cond[0] satisfies never;
                throw new Error("unknown state machine condition " + cond[0]);
        }
    }
    jump() {
        const [rule, newState] = (this.curData()?.jumpRule ?? []);
        if (this._evaluateCondition(rule!, false, false)) {
            this.entity.obj!.jump();
            this.setState(newState!);
        }
    }
    run(dt: number, velocity: Vec2, sprintSpeed: number, manualStop: boolean) {
        const { bones, pos, id, animator, obj } = this.entity;
        const { allowedComponents, sprint } = this.curData()!;
        if (allowedComponents)
            K.Vec2.scalec(velocity, allowedComponents.x, allowedComponents.y, velocity);
        console.trace();
        if (sprint) {
            animator.skinAnim(sprint, this.sprinting ? sprintSpeed : 0);
        }
        var i: number;
        const trs = this.curData()?.transitions ?? [];
        for (i = 0; i < trs.length; i++) {
            const [newState, condition] = trs[i]!;
            if (this._evaluateCondition(condition, !velocity.isZero(), manualStop)) {
                this.setState(newState);
                break;
            }
        }
        var didStep = false;
        for (i = 0; i < this._moving.length; i++) {
            // TODO: pass in index to be able to PLL-lock phase offsets?? how??
            didStep ||= this._moving[i]!.update(dt, velocity, bones, id, pos);
        }
        obj!.move(velocity);
        this.entity.startHook("move", { dir: { x: velocity.x, y: velocity.y }, sprinting: this.sprinting });
        if (didStep) this.entity.startHook("step");
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
        public ladderMode: boolean) { }
    update(dt: number, motionSpeed: Vec2, b: BonesMap, id: string, playerRootPos: Vec2): boolean {
        const o = b[this.bone]!;
        const delta = motionSpeed.len() / this.len! * dt;
        if (this.flip) {
            // TODO: flipping bounds on 
            const s = this.flip[motionSpeed.isZero() ? 2 : motionSpeed.x < 0 ? 0 : 1];
            if (s !== null) o.scaleTo(s ? -1 : 1, 1);
        }
        if (!this.moving) return false;
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
                moveFootToOffset(({ step: stepFunction, jump: (K.lerp<Vec2>) } as const)[this.mode!](this.curOffset!, this.nextOffset!, this._t, this.height!));
                if ((this._t += dt / this.time!) >= 1) {
                    this._planted = true;
                    K.Vec2.copy(this.nextOffset!, this.curOffset!);
                    return true;
                }
            }
        }
        return false;
    }
}

function stepFunction(p0: Vec2, p1: Vec2, progress: number, stepHeight: number) {
    const s = (b: number) => 1 / (1 + Math.sqrt(1 - b));
    const f = (x: number, b: number) => ((x - s(b)) ** 2) / (s(b) ** 2) - 1;
    const y = (a: number, b: number, x: number, h: number) => b < a ? h * f(1 - x, (b - a) / h) + b : h * f(x, (a - b) / h) + a;
    if (stepHeight <= 0) stepHeight = 1e-6; // prevent divide by 0
    return K.vec2(K.lerp(p0.x, p1.x, progress), y(p0.y, p1.y, progress, stepHeight));
}
