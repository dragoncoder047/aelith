import { BodyComp, Comp, DrawCircleOpt, DrawLineOpt, GameObj, KAPLAYCtx, PosComp, Vec2 } from "kaplay";

export interface SpringCompOpt {
    other?: GameObj<BodyComp | PosComp>
    p1?: Vec2
    p2?: Vec2
    forceSelf?: boolean,
    forceOther?: boolean
    length?: number | "auto"
    springConstant?: number
    springDamping?: number
    dampingClamp?: number
    drawOpts?: Omit<DrawLineOpt | DrawCircleOpt, "p1" | "p2" | "pos" | "radius">
}

export interface SpringComp extends Comp {
    other: GameObj<BodyComp | PosComp>
    p1: Vec2
    p2: Vec2,
    forceSelf: boolean,
    forceOther: boolean
    length: number
    springConstant: number
    springDamping: number
    dampingClamp: number
    drawOpts: Omit<DrawLineOpt & DrawCircleOpt, "p1" | "p2" | "pos" | "radius">,
    readonly actualP2: Vec2
    _applyForces(f: Vec2): void,
}

export interface KAPLAYSpringsPlugin {
    spring(opts?: SpringCompOpt): SpringComp
}

export function kaplaySprings(K: KAPLAYCtx): KAPLAYSpringsPlugin {
    return {
        // @ts-expect-error
        spring(opts = {}) {
            if (!opts.other?.has("body")) opts.forceOther = false;
            opts.drawOpts = Object.assign({ width: 2, color: K.WHITE }, opts.drawOpts);
            return {
                id: "spring",
                require: ["body", "pos"],
                other: opts.other ?? K.getTreeRoot(),
                p1: opts.p1 ?? K.vec2(0, 0),
                p2: opts.p2 ?? K.vec2(0, 0),
                forceSelf: opts.forceSelf ?? true,
                forceOther: opts.forceOther ?? true,
                length: opts.length ?? "auto",
                dampingClamp: opts.dampingClamp ?? 10,
                springConstant: opts.springConstant ?? 20,
                springDamping: opts.springDamping ?? 0,
                drawOpts: opts.drawOpts,
                add() {
                    // @ts-expect-error
                    if (this.length === "auto") {
                        this.length = this.actualP2.sub(this.p1).len();
                    }
                },
                get actualP2() {
                    const flippedP2 = this.p2.clone();
                    if ((this.other as any).flipX) flippedP2.x *= -1;
                    if ((this.other as any).flipY) flippedP2.y *= -1;
                    const otherLocalPoint = flippedP2.rotate((this.other as any).angle ?? 0).scale((this.other as any).scale ?? K.vec2(1));
                    const selfLocalPoint = (this as any).fromWorld(this.other.toWorld(otherLocalPoint));
                    const where = selfLocalPoint.scale(((this as any).scale ?? K.vec2(1)).invScale(1)).rotate(-((this as any).angle ?? 0));
                    return where;
                },
                fixedUpdate(this: GameObj<BodyComp | SpringComp>) {
                    const displacement = this.actualP2.sub(this.p1);
                    const targetDisplacement = displacement.unit().scale(this.length);

                    const springForce = targetDisplacement.sub(displacement).scale(this.springConstant);
                    this._applyForces(springForce);

                    const relVel = this.other.vel.sub(this.vel).project(displacement);
                    const rvl = relVel.len();
                    const relVelClamped = rvl > this.dampingClamp ? relVel.scale(this.dampingClamp / rvl) : relVel;
                    const dampingForce = relVelClamped.scale(Math.expm1(-this.springDamping * K.fixedDt()));
                    this._applyForces(dampingForce);
                },
                _applyForces(this: GameObj<BodyComp | SpringComp>, f) {
                    if (!this.isStatic && this.forceSelf) this.addForce(f.scale(-1 / 2));
                    if (!this.other.isStatic && this.forceOther) this.other.addForce(f.scale(1 / 2));
                },
                draw() {
                    K.drawLine({
                        ...this.drawOpts,
                        p1: this.p1,
                        p2: this.actualP2,
                    });
                    K.drawCircle({
                        ...this.drawOpts,
                        radius: this.drawOpts.width! / 2,
                        pos: this.p1,
                    });
                    K.drawCircle({
                        ...this.drawOpts,
                        radius: this.drawOpts.width! / 2,
                        pos: this.actualP2,
                    });
                }
            }
        }
    };
}