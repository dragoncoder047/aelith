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
        const targets: Record<string, [string[], LerpValue[], number]> = {};
        const endedAnims: string[] = [];
        for (var i = 0; i < this.animations.length; i++) {
            const anim = this.animations[i]!;
            if (anim.running) {
                const values = anim.update(dt);
                for (var [path, value, alpha] of values) {
                    const e = (targets[path.join(",")] ??= [path, [], 0]);
                    e[1].push(value);
                    e[2] = Math.max(e[2], alpha);
                }
                if (anim.finished()) endedAnims.push(anim.name);
            }
        }
        this._copyValues(dt, targets);
        for (var a of endedAnims) {
            this.stop(a);
        }
    }
    private _copyValues(dt: number, targets: Record<string, [string[], LerpValue[], number]>) {
        if (this.entity.obj) {
            for (var p of Object.keys(targets)) {
                const [unjoinedPath, values, maxAlpha] = targets[p]!;
                const targetValue = averageAll(values);
                const [tv, lk] = splitV(this.entity.bones, unjoinedPath);
                tv[lk] = K.lerp(tv[lk] as LerpValue, targetValue, K.clamp(dt * Math.LN2 * maxAlpha, 0, 1));
            }
        }
    }
    play(animName: string, onended: () => void) {
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
        anim.start(this.entity.bones);
    }
    stop(animName: string) {
        const anim = this.animations.find(a => a.name === animName);
        if (!anim || !anim.running) return;
        anim.stop(this.entity.bones);
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

function averageAll<T extends LerpValue>(values: T[]): T {
    const oneOverLength = 1 / values.length;
    if (values.length >= 1) {
        if (typeof values[0] === "number") return (values as number[]).reduce((a, b) => a + b, 0) * oneOverLength as T;
        if (values[0] instanceof K.Vec2) return (values as Vec2[]).reduce((a, b) => K.Vec2.add(a, b, a), K.vec2()).scale(oneOverLength) as T;
        if (values[0] instanceof K.Color) return (values as Color[]).reduce((acc, { r, g, b }) => (acc.r += r, acc.g += g, acc.b += b, acc), new K.Color(0, 0, 0)).mult(new K.Color(oneOverLength, oneOverLength, oneOverLength)) as T;
    } else throw new Error("aaa no values");
    throw new Error("wtf value is this: " + values[0]);
}

function splitV(obj: any, path: string[]): [any, string] {
    for (var i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]!];
    }
    return [obj, path[i]!];
}
