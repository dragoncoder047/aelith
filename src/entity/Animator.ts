import { Color, LerpValue, Vec2 } from "kaplay";
import { Animation, createAnimation } from "./Animation";
import { Entity } from "./Entity";
import * as EntityManager from "./EntityManager";
import { K } from "../context";

export class Animator {
    animations: Animation[] = [];
    constructor(public entity: Entity) {
    }
    update(dt: number) {
        const targets: Record<string, [string[], LerpValue[], number, number[]]> = {};
        const endedAnims: string[] = [];
        for (var i = 0; i < this.animations.length; i++) {
            const anim = this.animations[i]!;
            if (anim.running) {
                const values = anim.update(dt);
                for (var i = 0; i < values.length; i++) {
                    const [path, value, alpha, passive] = values[i]!;
                    const ps = path.join(",");
                    if (targets[ps] && passive) anim.channels[i]!.inProgress = false; 
                    else targets[ps] =  [path, [], 0, []]
                    const e = targets[ps];
                    e[1].push(value);
                    e[2] = Math.max(e[2], alpha);
                    e[3].push(anim.skinAmount);
                }
                if (anim.finished()) endedAnims.push(anim.name);
            }
        }
        this._copyValues(dt, targets);
        for (var a of endedAnims) {
            this.stop(a);
        }
    }
    private _copyValues(dt: number, targets: Record<string, [string[], LerpValue[], number, number[]]>) {
        if (this.entity.obj) {
            for (var p of Object.keys(targets)) {
                const [unjoinedPath, values, maxAlpha, weights] = targets[p]!;
                const targetValue = averageAll(values, weights);
                const [tv, lk] = splitV(this.entity.bones, unjoinedPath);
                tv[lk] = K.lerp(tv[lk] as LerpValue, targetValue, K.clamp(dt * Math.LN2 * maxAlpha, 0, 1));
            }
        }
    }
    play(animName: string, onended: () => void, forceRestart: boolean) {
        const anim = this.animations.find(a => a.name === animName);
        if (!anim) throw new Error(`No animation ${animName} on ${this.entity.kind}`);
        for (var s of anim.replace) {
            this.stop(s);
        }
        for (var s of anim.override) {
            const a2 = this.animations.find(a => a.name === s)
            if (a2) a2.pauseFor(anim);
        }
        anim.onEnd.add(onended);
        if (forceRestart || !anim.running) anim.start(this.entity.bones);
    }
    skinAnim(animName: string, value: number) {
        const anim = this.animations.find(a => a.name === animName);
        if (!anim) throw new Error(`No animation ${animName} on ${this.entity.kind}`);
        anim.skinAmount = value;
    }
    stop(animName: string) {
        const anim = this.animations.find(a => a.name === animName);
        if (!anim || !anim.running) return;
        anim.stop();
        for (var a2 of this.animations) {
            a2.maybeUnpauseFor(anim);
        }
    }
    isPlaying(animName: string) {
        return this.animations.some(a => a.name === animName && a.running);
    }
}

export function buildAnimations(kind: string, animator: Animator) {
    const { anims } = EntityManager.getEntityPrototypeStrict(kind).model;
    if (!anims) return;
    for (var animName of Object.keys(anims)) {
        animator.animations.push(createAnimation(animName, anims[animName]!));
    }
}

function averageAll<T extends LerpValue>(values: T[], weights: number[]): T {
    const FACTOR = 1 / weights.reduce((a, b) => a + b);
    if (values.length >= 1) {
        if (typeof values[0] === "number") return (values as number[]).reduce((a, b, i) => a + b * weights[i]!, 0) * FACTOR as T;
        if (values[0] instanceof K.Vec2) return (values as Vec2[]).reduce((a, b, i) => K.Vec2.addScaled(a, b, weights[i]!, a), K.vec2()).scale(FACTOR) as T;
        if (values[0] instanceof K.Color) return (values as Color[]).reduce((acc, { r, g, b }, i) => (acc.r += r * weights[i]!, acc.g += g * weights[i]!, acc.b += b * weights[i]!, acc), new K.Color(0, 0, 0)).mult(new K.Color(FACTOR, FACTOR, FACTOR)) as T;
    } else throw new Error("wtf value is this: " + values[0]);
    throw new Error("aaa no values");
}

function splitV(obj: any, path: string[]): [any, string] {
    for (var i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]!];
    }
    return [obj, path[i]!];
}
