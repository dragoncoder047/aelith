import type { BodyComp, Comp, DrawLinesOpt, GameObj, InternalGameObjRaw, KAPLAYCtx, PosComp, Vec2 } from "kaplay";

export interface DistancePlusOpt {
    other?: GameObj<BodyComp | PosComp>
    p1?: Vec2
    p2?: Vec2
    length?: number | "auto"
    drawOpts?: Omit<DrawLinesOpt, "pts">
    alpha?: number
    beta?: number
}

export interface DistanceCompPlus extends Comp {
    other: GameObj<PosComp | BodyComp | PosComp>
    p1: Vec2
    p2: Vec2,
    length: number
    drawOpts: Omit<DrawLinesOpt, "pts">
    alpha: number
    beta: number
    readonly worldP1: Vec2
    readonly worldP2: Vec2
    readonly localP1: Vec2
    readonly localP2: Vec2;
}

export interface ChainMovableComp {
}

export interface KAPLAYDistanceCompPlusPlugin {
    extradistance(opts?: DistancePlusOpt): DistanceCompPlus
    chainmovable(): ChainMovableComp
}

type DC = PosComp | BodyComp | DistanceCompPlus;

export function kaplayExtraDistance(K: KAPLAYCtx): KAPLAYDistanceCompPlusPlugin {
    return {
        // @ts-expect-error
        extradistance(opts = {}) {
            const
                scratch1 = K.vec2(),
                scratch2 = K.vec2(),
                scratch3 = K.vec2(),
                scratch4 = K.vec2();
            const math = (obj: GameObj<DC>) => {
                var P = obj,
                    len = obj.length,
                    doVel = true;
                for (; ;) {
                    doCorrections(obj, P, len, doVel, K);
                    if (P.other.has("extradistance")) {
                        doVel = false;
                        len += (P.other as any).length;
                        P = P.other as any;
                    }
                    else break;
                }
            }
            return {
                id: "extradistance",
                require: ["pos"],
                other: opts.other ?? K.getTreeRoot(),
                p1: opts.p1 ?? K.vec2(),
                p2: opts.p2 ?? K.vec2(),
                length: opts.length ?? "auto",
                drawOpts: opts.drawOpts,
                alpha: opts.alpha ?? .6,
                beta: opts.beta ?? 1.1,
                add() {
                    // @ts-expect-error
                    if (this.length === "auto") {
                        this.length = this.worldP2.sub(this.worldP1).len();
                    }
                },
                get worldP2() {
                    return this.other.transform.transformPointV(this.p2, scratch1);
                },
                get worldP1() {
                    return (this as any).transform.transformPointV(this.p1, scratch2);
                },
                get localP1() {
                    return (this as any).transform.inverse.transformPointV(this.worldP1, scratch3);
                },
                get localP2() {
                    return (this as any).transform.inverse.transformPointV(this.worldP2, scratch4);
                },
                update(this: GameObj<DC>) {
                    math(this);
                },
                fixedUpdate(this: GameObj<DC>) {
                    math(this);
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
        },
        chainmovable() {
            return {
                id: "chainmovable",
                require: ["body"]
            }
        },
    };
}

function canBeMoved(obj: GameObj<DC>) {
    return obj.has("chainmovable") && !obj.isStatic;
}

function doCorrections(A: GameObj<DC>, M: GameObj<DC>, len: number, doMinimum: boolean, K: KAPLAYCtx) {
    // world vector A -> B
    const B = M.other as GameObj<DC>;
    const { x: dx, y: dy } = M.worldP2.sub(M.worldP1);
    const dist = Math.hypot(dx, dy);
    if (!isFinite(dist) || dist === 0) return;

    // unit direction from A -> B (points toward B)
    const ux = dx / dist;
    const uy = dy / dist;

    // positional error: positive if currently too long
    const error = dist - len;
    if (!doMinimum && error < 0) return;

    // use inverse mass weighting
    const mA = canBeMoved(A) ? A.mass : Infinity;
    const mB = canBeMoved(B) ? B.mass : Infinity;
    const invA = mA > 0 ? 1 / mA : 0;
    const invB = mB > 0 ? 1 / mB : 0;
    const invSum = invA + invB;
    if (invSum === 0) return; // both static... how did we get here...

    const corrMag = error * A.alpha;

    // position corrections: move A toward/away from B by +corr * (invA / invSum)
    //                   and move B toward/away from A by -corr * (invB / invSum)
    const corrAx = ux * corrMag * (invA / invSum);
    const corrAy = uy * corrMag * (invA / invSum);
    const corrBx = -ux * corrMag * (invB / invSum);
    const corrBy = -uy * corrMag * (invB / invSum);

    correct(A, corrAx, corrAy, K);
    correct(B, corrBx, corrBy, K);

    // Velocity correction
    const vA = A.vel ?? K.Vec2.ZERO;
    const vB = B.vel ?? K.Vec2.ZERO;
    // relative velocity along dir (scalar): (vB - vA).dot(u)
    const relAlong = ((vB.x - vA.x) * ux + (vB.y - vA.y) * uy);
    if (!doMinimum && relAlong < 0) return;
    const factor = relAlong * A.beta;
    // velocity change to apply: dvA = +u * (invA/invSum) * relAlong
    //                           dvB = -u * (invB/invSum) * relAlong
    const dvAx = ux * (invA / invSum) * factor;
    const dvAy = uy * (invA / invSum) * factor;
    const dvBx = -ux * (invB / invSum) * factor;
    const dvBy = -uy * (invB / invSum) * factor;
    if (canBeMoved(A)) A.applyImpulse(K.vec2(dvAx, dvAy));
    if (canBeMoved(B)) B.applyImpulse(K.vec2(dvBx, dvBy));
}

function correct(obj: GameObj<DC>, dx: number, dy: number, K: KAPLAYCtx) {
    if (canBeMoved(obj)) {
        obj.worldPos = obj.worldPos.add(dx, dy);
    }
}
