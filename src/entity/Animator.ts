import { Color, GameObj, LerpValue, Vec2 } from "kaplay";
import { K } from "../context";
import { Animation, AnimUpdateResults, createAnimation } from "./Animation";
import { Entity } from "./Entity";
import * as EntityManager from "./EntityManager";

/*

how animations work (new version, not implemented yet):

each animation has behavior attributes:
- the "strength" of the animation (skinning/blend parameter)
- which animations it "shadows"
- which animations it "interrupts"
- which animations it "cancels"

and each channel has state attributes:
- the progress value
- whether the animations is "active" or not
- whether the channel loops infinitely
- whether the channel "sticks" at the end

when an animation is started:
- all of the channels are set to active and progress rewound to 0
- all of the animations this "cancels" are stopped
- all of the animation channels controlling the same paths that have "stickied" to the end are stopped.

on each frame:
- each animation checks if it is at the end of its timeline.
    - if it is supposed to loop it resets to t=0.
    - if it is sticky, it keeps active=true, but stops advancing time
    - if not sticky, stops
    - if all channels are now finished (inactive), the whole animation stops and the onEnd events fire
- the relative dt for each animation is calculated
    - normally K.dt(), but if any other animation "interrupts" this, it is 0.
- each animation has the progress value updated by its dt.
- then the final value for each path is the weighted average of the values for each animation channel's
  output (weighted by the anim skinning parameter) with the weights set to 0 if there is any animation
  that "shadows" this
- if no animation is controlling that path presently, the initial value is used.

when an animation channel is stopped:
- it is set as active=false

*/

export class Animator {
    animations: Animation[] = [];
    baseValues = new Map<string, [string[], any]>();
    lastAlphas = new Map<string, number>();
    constructor(public entity: Entity) {
    }
    init() {
        if (this.entity.obj) {
            const obj = this.entity.bones;
            for (var anim of this.animations) {
                for (var ch of anim.channels) {
                    const key = ch.target.join(",");
                    if (!this.baseValues.has(key)) {
                        const [o, k] = splitV(obj, ch.target);
                        this.baseValues.set(key, [ch.target, o[k]]);
                    }
                }
            }
        }
    }
    update(dt: number) {
        const targetsMap = new Map<string, AnimUpdateResults>();
        const targetsList: AnimUpdateResults[] = [];
        const usedPaths = new Set<string>();
        const si = this.animations.map(({ name }) => {
            var shadowed = false;
            var interrupted = false;
            for (var anim2 of this.animations) {
                if (anim2.running) {
                    if (anim2.interrupt.some(x => x === name)) interrupted = true;
                    if (anim2.shadow.some(x => x === name)) shadowed = true;
                }
            }
            return [shadowed, interrupted] as const;
        });
        const addValue = (target: string[], val: any, alpha: number | undefined, weight: number) => {
            const key = target.join(",");
            var res: AnimUpdateResults;
            usedPaths.add(key);
            if (!targetsMap.has(key)) {
                res = [target, [val], alpha!, [weight]];
                targetsMap.set(key, res);
                targetsList.push(res);
            } else {
                res = targetsMap.get(key)!
                res[1].push(val);
                if (alpha) res[2] = Math.max(res[2], alpha);
                res[3].push(weight);
            }
        }
        for (var i = 0; i < this.animations.length; i++) {
            const anim = this.animations[i]!;
            const [interrupted, shadowed] = si[i]!
            for (var j = 0; j < anim.channels.length; j++) {
                const channel = anim.channels[j]!
                if (channel.active) {
                    const val = channel.update(interrupted ? 0 : dt);
                    if (!shadowed) {
                        addValue(channel.target, val, channel.alpha, anim.weight);
                    }
                }
            }
            if (anim.allDone()) {
                anim.stop();
            }
        }
        for (var [k, [path, value]] of this.baseValues.entries()) {
            addValue(path, value, usedPaths.has(k) ? undefined : (this.lastAlphas.get(k) ?? 10), 1e-6);
        }
        this._copyValues(dt, targetsList);
    }
    private _copyValues(dt: number, targets: AnimUpdateResults[]) {
        if (this.entity.kind === "explorer") console.log(JSON.stringify(targets));
        for (var p = 0; p < targets.length; p++) {
            const [unjoinedPath, values, maxAlpha, weights] = targets[p]!;
            this.lastAlphas.set(unjoinedPath.join(","), maxAlpha);
            if (this.entity.obj) {
                const targetValue = averageAll(values, weights);
                const [tv, lk] = splitV(this.entity.bones, unjoinedPath);
                tv[lk] = K.lerp(tv[lk] as LerpValue, targetValue, K.clamp(dt * Math.LN2 * maxAlpha, 0, 1));
            }
        }
    }
    play(animName: string, onended: () => void, forceRestart: boolean) {
        const anim = this.animations.find(a => a.name === animName);
        if (!anim) throw new Error(`No animation ${animName} on ${this.entity.kind}`);
        for (var s of anim.cancel) {
            this.stop(s);
        }
        for (var p of anim.channels) {
            for (var a2 of this.animations) {
                if (a2 === anim) continue;
                a2.unstick(p.target);
            }
        }
        anim.onEnd.add(onended);
        if (forceRestart || !anim.running) {
            anim.start();
        }
    }
    skinAnim(animName: string, value: number) {
        const anim = this.animations.find(a => a.name === animName);
        if (!anim) throw new Error(`No animation ${animName} on ${this.entity.kind}`);
        anim.weight = value;
    }
    stop(animName: string) {
        const anim = this.animations.find(a => a.name === animName);
        if (!anim || !anim.running) return;
        anim.stop();
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
    var FACTOR = 1 / weights.reduce((a, b) => a + b);
    if (!isFinite(FACTOR)) FACTOR = 1;
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
