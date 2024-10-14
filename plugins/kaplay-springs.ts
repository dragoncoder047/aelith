import { BodyComp, DrawCircleOpt, DrawLineOpt, GameObj, KAPLAYCtx, PosComp, Vec2 } from "kaplay";

export interface SpringCompOpt {
    other: GameObj<BodyComp | PosComp>
    p1?: Vec2
    p2?: Vec2
    length?: number | "auto"
    springConstant?: number
    damping?: number
    drawOpts: Omit<DrawLineOpt | DrawCircleOpt, "p1" | "p2" | "pos" | "radius">
}

export interface SpringComp {
    other: GameObj<BodyComp | PosComp>
    p1: Vec2
    p2: Vec2
    length: number
    springConstant: number
    damping: number
    drawOpts: Omit<DrawLineOpt & DrawCircleOpt, "p1" | "p2" | "pos" | "radius">,
    readonly actualP2: Vec2
}

export interface KAPLAYSpringsPlugin {
    spring(opts?: SpringCompOpt): SpringComp
}

export function kaplaySprings(K: KAPLAYCtx):KAPLAYSpringsPlugin {
    return {
        // @ts-expect-error
        spring(opts = {}) {
            if (!opts.other) throw new Error("need other on spring");
            if (!opts.other.is("body")) throw new Error("other needs to be a body");
            opts.drawOpts = Object.assign({ width: 2, color: K.WHITE, cap: "round", join: "round" }, opts.drawOpts);
            return {
                id: "spring",
                require: ["body", "pos"],
                other: opts.other,
                p1: opts.p1 ?? K.vec2(0, 0),
                p2: opts.p2 ?? K.vec2(0, 0),
                length: opts.length ?? "auto",
                springConstant: opts.springConstant ?? 20,
                damping: opts.damping ?? 0,
                drawOpts: opts.drawOpts,
                add() {
                    // @ts-expect-error
                    if (this.length === "auto") {
                        this.length = this.actualP2.sub(this.p1).len();
                    }
                },
                get actualP2() {
                    return (this as unknown as GameObj<PosComp>).fromWorld(this.other.toWorld(this.p2));
                },
                fixedUpdate(this: GameObj<BodyComp | SpringComp>) {
                    const displacement = this.actualP2.sub(this.p1);
                    const targetDisplacement = displacement.unit().scale(this.length);

                    const force = targetDisplacement.sub(displacement).scale(this.springConstant);
                    if (!this.isStatic) this.addForce(force.scale(-1));
                    if (!this.other.isStatic) this.other.addForce(force);

                    const relVel = this.other.vel.sub(this.vel).project(displacement);
                    const dampingForce = relVel.scale(Math.expm1(-this.damping * K.dt() * K.dt()));
                    if (!this.isStatic) this.addForce(dampingForce.scale(-1 / 2));
                    if (!this.other.isStatic) this.other.addForce(dampingForce.scale(1 / 2));
                },
                draw() {
                    K.drawLine({
                        ...this.drawOpts,
                        p1: this.p1,
                        p2: this.actualP2,
                    });
                    K.drawCircle({
                        ...this.drawOpts,
                        radius: this.drawOpts.width!,
                        pos: this.p1,
                    });
                    K.drawCircle({
                        ...this.drawOpts,
                        radius: this.drawOpts.width!,
                        pos: this.actualP2,
                    });
                }
            }
        }
    };
}
