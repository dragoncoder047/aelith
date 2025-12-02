import { Comp, EmitterOpt, GameObj, ParticlesOpt, Quad, Texture } from "kaplay";
import { K } from "../context";
import { XY } from "../DataPackFormat";

export interface SimpleParticlesCompOpt {
    time?: [number, number],
    speed?: [number, number],
    acc?: [XY, XY],
    damp?: [number, number],
    dir?: number,
    spin?: [number, number],
    anim?: {
        scale?: number[],
        color?: string[],
        trans?: number[],
    },
    sprite?: [string, number];
    pps: number;
    spread?: number,
}

export interface SimpleParticlesComp extends Comp {
    particles: {
        rate: number;
        dir: number;
        spread: number;
    }
}

export function simpleParticles(opt: SimpleParticlesCompOpt): SimpleParticlesComp {
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
        max: 1000,
        lifeTime: opt.time,
        speed: opt.speed,
        acceleration: opt.acc && [K.vec2(opt.acc[0].x, opt.acc[0].y), K.vec2(opt.acc[1].x, opt.acc[1].y)],
        damping: opt.damp,
        scales: opt.anim?.scale,
        colors: opt.anim?.color && opt.anim.color.map(K.rgb),
        opacities: opt.anim?.trans,
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
