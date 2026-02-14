import { Comp, EmitterOpt, GameObj, ParticlesOpt, Quad, Texture } from "kaplay";
import { K } from "../../src/context";
import { ParticlePrimitive } from "./primitive";
export interface SimpleParticlesComp extends Comp {
    particles: {
        rate: number;
        dir: number;
        spread: number;
    }
}

export function simpleParticles(opt: ParticlePrimitive): SimpleParticlesComp {
    var t: Texture, q: Quad;
    if (opt.sprite) {
        const spr = K.getSprite(opt.sprite[0])!.data!;
        t = spr.tex;
        q = spr.frames[opt.sprite[1]]!;
    } else {
        t = K._k.gfx.defTex;
        q = K.quad(0, 0, 1, 1);
    }
    const pOpt: ParticlesOpt = {
        max: 2000,
        lifeTime: opt.time,
        speed: opt.speed,
        acceleration: opt.acc && [K.Vec2.deserialize(opt.acc[0]), K.Vec2.deserialize(opt.acc[1])],
        damping: opt.damp,
        scales: opt.anim?.scale,
        colors: opt.anim?.color && opt.anim.color.map(c => K.rgb(c)),
        opacities: opt.anim?.trans,
        angularVelocity: opt.spin,
        texture: t,
        quads: [q]
    };
    const eOpt: EmitterOpt = {
        rate: opt.pps,
        direction: opt.dir!,
        position: K.Vec2.ZERO,
        spread: opt.spread!,
    }
    return {
        id: "simpleParticles",
        add(this: GameObj) {
            this.use(K.particles(pOpt, eOpt));
        },
        particles: {
            get rate() {
                return eOpt.rate!;
            },
            set rate(r) {
                eOpt.rate = r;
            },
            get dir() {
                return eOpt.direction;
            },
            set dir(d) {
                eOpt.direction = d;
            },
            get spread() {
                return eOpt.spread;
            },
            set spread(s) {
                eOpt.spread = s;
            }
        }
    }
}
