import type { BodyComp, Comp, DrawCircleOpt, DrawLineOpt, DrawLinesOpt, GameEventMap, GameObj, KAPLAYCtx, PosComp, Vec2 } from "kaplay";

export interface DistancePlusOpt {
    other?: GameObj<BodyComp | PosComp>
    p1?: Vec2
    p2?: Vec2
    moveSelf?: boolean;
    moveOther?: boolean;
    length?: number | "auto"
    drawOpts?: Omit<DrawLinesOpt, "pts">
}

export interface DistanceCompPlus extends Comp {
    other: GameObj<PosComp | BodyComp | PosComp>
    p1: Vec2
    p2: Vec2,
    length: number
    drawOpts: Omit<DrawLinesOpt, "pts">
    readonly worldP1: Vec2
    readonly worldP2: Vec2
    readonly localP1: Vec2
    readonly localP2: Vec2;
}

export interface KAPLAYSpringsPlugin {
    extradistance(opts?: DistancePlusOpt): DistanceCompPlus
}

const ALPHA = 1.5, BETA = 0.5;
export function kaplayExtraDistance(K: KAPLAYCtx): KAPLAYSpringsPlugin {
    return {
        // @ts-expect-error
        extradistance(opts = {}) {
            if (!opts.other?.has("body")) opts.moveOther = false;
            return {
                id: "extradistance",
                require: ["pos"],
                other: opts.other ?? K.getTreeRoot(),
                p1: opts.p1 ?? K.vec2(0, 0),
                p2: opts.p2 ?? K.vec2(0, 0),
                length: opts.length ?? "auto",
                drawOpts: opts.drawOpts,
                add() {
                    // @ts-expect-error
                    if (this.length === "auto") {
                        this.length = this.worldP2.sub(this.worldP1).len();
                    }
                },
                get worldP2() {
                    return this.other.transform.transformPointV(this.p2, K.vec2());
                },
                get worldP1() {
                    return (this as any).transform.transformPointV(this.p1, K.vec2());
                },
                get localP1() {
                    return (this as any).transform.inverse.transformPointV(this.worldP1, K.vec2());
                },
                get localP2() {
                    return (this as any).transform.inverse.transformPointV(this.worldP2, K.vec2());
                },
                update(this: GameObj<PosComp | BodyComp | DistanceCompPlus>) {

                    const A = this, B = this.other;

                    // world vector A -> B
                    const { x: dx, y: dy } = A.worldP2.sub(A.worldP1);
                    const dSqr = dx * dx + dy * dy;

                    const dist = Math.sqrt(dSqr);
                    if (!isFinite(dist) || dist === 0) return;

                    // unit direction from A -> B (points toward B)
                    const ux = dx / dist;
                    const uy = dy / dist;

                    // positional error: positive if currently too long
                    const error = dist - this.length;

                    // use inverse mass weighting
                    const mA = A.isStatic || !opts.moveSelf ? Infinity : A.mass;
                    const mB = B.isStatic || !opts.moveOther ? Infinity : B.mass;
                    const invA = mA > 0 ? 1 / mA : 0;
                    const invB = mB > 0 ? 1 / mB : 0;
                    const invSum = invA + invB;
                    if (invSum === 0) return; // both static... how did we get here...

                    const corrMag = error * ALPHA;

                    // position corrections: move A toward/away from B by +corr * (invA / invSum)
                    //                   and move B toward/away from A by -corr * (invB / invSum)
                    const corrAx = ux * corrMag * (invA / invSum);
                    const corrAy = uy * corrMag * (invA / invSum);
                    const corrBx = -ux * corrMag * (invB / invSum);
                    const corrBy = -uy * corrMag * (invB / invSum);

                    // Update local pos if parented (so we don't just get reset by the next calcTransform())
                    if (opts.moveSelf) {
                        A.transform.e += corrAx;
                        A.transform.f += corrAy;
                        if (A.parent) {
                            const t = A.parent.transform.inverse.mul(A.transform);
                            A.pos.x = t.e;
                            A.pos.y = t.f;
                        } else {
                            A.pos.x = A.transform.e;
                            A.pos.y = A.transform.f;
                        }
                    }
                    if (opts.moveOther) {
                        B.transform.e += corrBx;
                        B.transform.f += corrBy;
                        if (B.parent) {
                            const t2 = B.parent.transform.inverse.mul(B.transform);
                            B.pos.x = t2.e;
                            B.pos.y = t2.f;
                        } else {
                            B.pos.x = B.transform.e;
                            B.pos.y = B.transform.f;
                        }
                    }


                    // Velocity correction
                    const vA = A.vel ?? K.vec2(0);
                    const vB = B.vel ?? K.vec2(0);
                    // relative velocity along dir (scalar): (vB - vA).dot(u)
                    const relAlong = (vB.x - vA.x) * ux + (vB.y - vA.y) * uy * BETA;
                    // velocity change to apply: dvA = +u * (invA/invSum) * relAlong
                    //                           dvB = -u * (invB/invSum) * relAlong
                    const dvAx = ux * (invA / invSum) * relAlong;
                    const dvAy = uy * (invA / invSum) * relAlong;
                    const dvBx = -ux * (invB / invSum) * relAlong;
                    const dvBy = -uy * (invB / invSum) * relAlong;

                    if (opts.moveSelf) A.applyImpulse(K.vec2(dvAx, dvAy));
                    if (opts.moveOther) B.applyImpulse(K.vec2(dvBx, dvBy));
                },
                draw(this: GameObj<PosComp | DistanceCompPlus>) {
                    K.drawLines({
                        ...this,
                        ...this.drawOpts,
                        pos: K.Vec2.ZERO,
                        pts: [this.localP1, this.localP2],
                    });
                }
            }
        }
    };
}