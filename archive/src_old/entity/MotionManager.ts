import { AreaComp, BoneComp, GameObj, KEventController, Vec2 } from "kaplay";
import { K } from "../../src/context";
import { CrustyJSONCode, EntityMoveAnimDef, EntityMovingBoneData } from "../DataPackFormat";
import { BonesMap, Entity } from "./Entity";
import { ScriptRunner } from "../script/ScriptHandler";

export class MotionManager {
    state: string = null as any;
    bases: Record<string, Vec2> = {};
    private _moving: MovingBone[] = [];
    private _stateChange = new K.KEvent<[EntityMoveAnimDef | null, EntityMoveAnimDef]>();
    sprinting = false;
    constructor(public entity: Entity, public data: Record<string, EntityMoveAnimDef> = {}) {
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
    private _getData(): {
        a?: string,
        s?: string | [string, string],
        c: boolean,
        d: EntityMovingBoneData[],
        l: number,
        h: number,
        t: number,
    } {
        const x = this.curData();
        return x ? {
            a: x.anim,
            s: x.sprint,
            c: x.gravityScale === 0,
            d: x.bones ?? [],
            l: x.steps?.len ?? 1,
            h: x.steps?.height ?? 0,
            t: x.steps?.time ?? 0
        } : { c: false, d: [], l: 1, h: 0, t: 0 };
    }
    private _ended() {
        for (var b of this._moving) {
            this.entity.bones[b.bone]!.pos = this.bases[b.bone]!.clone();
        }
        const { a, s } = this._getData();
        const stop = (anim: string) => this.entity.stopAnim(anim);
        if (a) stop(a);
        if (s) (Array.isArray(s) ? (stop(s[0]), stop(s[1])) : stop(s));
    }
    setState(state: string | null) {
        if (this._didChangeStateTo(state!)) {
            const { a, s, c, d, l, h, t } = this._getData();
            const start = (anim: string) => this.entity.playAnim(anim);
            const startskin = (anim: string) => {
                start(anim);
                this.entity.animator.skinAnim(anim, 0);
            }
            if (a) start(a);
            if (s) {
                if (Array.isArray(s)) {
                    startskin(s[0]);
                    startskin(s[1]);
                } else {
                    startskin(s);
                }
            }
            this._moving = this._createData(d, c, l, h, t);
        }
    }
    private _createData(d: EntityMovingBoneData[], climbMode: boolean, masterLen: number, height: number, time: number): MovingBone[] {
        return d.map(({ bone, flip, stepMode, phaseOffset, len }) => {
            const b = new MovingBone(bone, flip, climbMode);
            if (stepMode) {
                b.offsetFromPlayerPos = this.entity.obj!.fromWorld(this.entity.bones[bone]!.worldPos);
                b.curOffset = K.vec2();
                b.mode = stepMode;
                b.len = len ?? masterLen;
                b.height = height;
                b.time = time;
                b.phaseOffset = (phaseOffset ?? 0);
            }
            return b;
        });
    }
    private _cR = new ScriptRunner;
    private _evaluateCondition(name: string, cond: CrustyJSONCode, moving: boolean, manualStop: boolean): boolean {
        return this._cR.call(name, cond, {
            grounded: this.entity.obj!.isGrounded(),
            moving,
            manual: manualStop,
        });
    }
    jump() {
        const jumpData = (this.curData()?.jumpRule ?? []);
        if (this._evaluateCondition("jump function", jumpData[0]!, false, false)) {
            this.entity.obj!.jump();
            this.entity.startHook("jump");
            if (jumpData[1]) this.setState(jumpData[1]);
        }
    }
    private _phase = 0;
    run(dt: number, velocity: Vec2, sprintValue: number, manualStop: boolean) {
        const { bones, pos, id, animator, obj } = this.entity;
        const { allowedComponents, sprint, steps } = this.curData() ?? {};
        if (allowedComponents)
            K.Vec2.scalec(velocity, allowedComponents.x, allowedComponents.y, velocity);
        if (sprint) {
            if (Array.isArray(sprint)) {
                animator.skinAnim(sprint[0], this.sprinting && velocity.x < 0 ? sprintValue : 0);
                animator.skinAnim(sprint[1], this.sprinting && velocity.x > 0 ? sprintValue : 0);
            } else {
                animator.skinAnim(sprint, this.sprinting ? sprintValue : 0);
            }
        }
        var i: number;
        const trs = this.curData()?.transitions ?? [];
        for (i = 0; i < trs.length; i++) {
            const d = trs[i]!, newState = d[0], condition = d[1];
            if (this._evaluateCondition(`transition from ${this.state} to ${newState}`, condition, !velocity.isZero(), manualStop)) {
                this.setState(newState);
                break;
            }
        }
        const p1 = this._phase;
        const p2 = (this._phase += velocity.len() / (steps?.len ?? 1) * dt);
        var didStep = false;
        for (i = 0; i < this._moving.length; i++) {
            const b = this._moving[i]!;
            const op1 = p1 + b.phaseOffset, op2 = p2 + b.phaseOffset;
            const shouldStartStep = Math.floor(op1) !== Math.floor(op2);
            didStep ||= b.update(op2, shouldStartStep, dt, velocity, bones, id, pos);
        }
        obj!.move(velocity);
        if (!velocity.isZero())
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
    phaseOffset = 0;
    offsetFromPlayerPos?: Vec2
    curOffset?: Vec2
    nextOffset?: Vec2
    mode?: EntityMovingBoneData["stepMode"]
    len?: number
    height?: number
    time?: number
    constructor(public bone: string,
        public flip: EntityMovingBoneData["flip"],
        public ladderMode: boolean) { }
    update(phase: number, shouldStartStep: boolean, dt: number, motionVector: Vec2, b: BonesMap, id: string, playerRootPos: Vec2): boolean {
        const o = b[this.bone]!;
        if (this.flip) {
            // TODO: flipping bounds on bones
            const i = motionVector.isZero() ? 2 : motionVector.x < 0 ? 0 : 1;
            const j = (i + 3) as 3 | 4 | 5; // why is typescript so stupid! it knows i is 0 | 1 | 2 so why can't it add 3??
            const s = this.flip[i];
            if ((s ?? null) !== null) {
                o.scaleTo(s ? -1 : 1, 1);
            }
            const b = this.flip[j];
            if ((b ?? null) !== null && o.has("bone")) {
                (o as any as GameObj<BoneComp>).setAngles(b![0], b![1]);
            }
        }
        if (!this.mode) return false;
        const zeroOffsetPos = this.offsetFromPlayerPos!.add(playerRootPos);
        const offsetToWorld = (offset: Vec2) => offset.add(zeroOffsetPos);
        const worldToOffset = (world: Vec2) => world.sub(zeroOffsetPos);
        const moveFootToOffset = (offset: Vec2) => {
            o.worldPos = offsetToWorld(offset);
        };
        if (this.mode === "free") {
            moveFootToOffset(K.vec2(this.height! * Math.cos(2 * Math.PI * phase), 0));
        } else {
            K.Vec2.addScaled(this.curOffset!, motionVector, -dt, this.curOffset!);
            if (this._planted) {
                moveFootToOffset(this.curOffset!);
                if (shouldStartStep) {
                    this._t = 0;
                    this._planted = false;
                    const o = (this.nextOffset ??= K.vec2());
                    K.Vec2.scale(this.curOffset!, -1, o);
                    K.Vec2.unit(o, o);
                    K.Vec2.scale(o, this.len! / 2, o);
                    const worldTarget = worldToOffset(this.nextOffset);
                    const maxLenSq = this.len! ** 2;
                    if (this.ladderMode) {
                        // Snap to nearest climbable
                        // TODO: use the broadphase retrieve()
                        const objs = K.get<AreaComp>("climbable", { only: "comps" });
                        // First: check all objects; if we're inside one use that point,
                        // if not raycast in the current direction; if we get a hit rotate it until the length is less than the step length
                        // if no ray hit give up
                        // TODO
                        for (var obj of objs) {
                            const area = obj.worldArea();
                        }
                    } else {
                        // Raycast to ground
                        // TODO
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
