import { EaseFunc, KEvent, LerpValue, Vec2 } from "kaplay";
import { EntityAnimData, XY } from "../DataPackFormat";
import { K } from "../context";

interface Keyframe<T extends LerpValue> {
    /** keyframe value */
    x: T | (() => T);
    _cx?: T;
    /** keyframe length */
    len: number;
    /** easing function (default linear) */
    ease?: EaseFunc;
}

class AnimChannel<T extends LerpValue> {
    t = 0;
    /** index into the keyframes array */
    i: number = 0;
    /** relative time into the current keyframe */
    relT: number = 0;
    active = false;
    ended = false;
    private _totalLength: number;
    constructor(
        public target: string[],
        public loop: boolean = false,
        public sticky: boolean = true,
        public alpha: number = 10,
        public keyframes: Keyframe<T>[],
        public interpolate: (a: T, b: T, progress: number) => T,
        public relative = false,
        public delay = 0) {
        if (keyframes.length === 0) throw new Error("Not valid to have 0 keyframes");
        if (keyframes.length === 1) {
            keyframes.push(Object.assign({}, keyframes[0]!));
        }
        for (var kf of this.keyframes) {
            kf._cx = (typeof kf.x === "function") ? kf.x() : kf.x;
        }
        this._totalLength = keyframes.reduce((a, { len }) => a + len, 0);
    }
    start() {
        this.rewind();
        this.active = true;
        this.ended = false;
        this.t = this.delay;
    }
    update(dt: number): T {
        const data = this._advance(dt), f1 = data[0], f2 = data[1], alpha = data[2];
        return this.interpolate(f1!, f2!, (this.keyframes[this.i]!.ease ?? ((x: number) => x))(alpha));
    }
    rewind() {
        this.i = this.relT = 0;
    }
    stop() {
        this.active = false;
    }
    private _advance(dt: number) {
        var i = this.i, d: number, frames = this.keyframes, len = frames.length;
        if (this.t > 0) {
            this.t -= dt;
        } else {
            if (this._totalLength === 0) {
                this.ended = !(this.active = this.sticky || this.loop);
                return [frames[0]!._cx, frames[0]!._cx, 1] as const;
            }
            if (!this.ended) this.relT += dt;
            // advance to next keyframes
            while ((d = frames[i]!.len) < this.relT) {
                this.relT -= d;
                i++;
                if (i === len) {
                    if (this.loop) i = 0;
                    else {
                        i--;
                        this.ended = true;
                        this.active = this.sticky;
                        break;
                    }
                }
                // re-do the randomization on the next frame
                const kf = frames[i]!;
                if (typeof kf.x === "function") {
                    kf._cx = kf.x();
                }
            }
            this.i = i;
        }
        return [frames[i]!._cx, frames[(i + 1) % len]!._cx, this.relT / frames[i]!.len] as const;
    }
}

export type AnimUpdateResults = [
    path: string[],
    values: any[],
    maxAlpha: number,
    weights: number[]
];

export class Animation {
    onEnd: KEvent = new K.KEvent;
    weight = 1;
    running = false;
    constructor(
        public name: string,
        public channels: AnimChannel<any>[],
        public interrupt: string[] = [],
        public cancel: string[] = [],
        public shadow: string[] = []) { }
    start() {
        this.channels.forEach(c => c.start());
        this.running = true;
    }
    unstick(path: string[]) {
        for (var ch of this.channels) {
            if (ch.target.every((x, i) => x === path[i]) && ch.ended) {
                ch.stop();
            }
        }
    }
    allDone() {
        return this.channels.every(c => !c.active);
    }
    stop() {
        this.channels.forEach(c => c.stop());
        this.onEnd.trigger();
        this.onEnd.clear();
        this.running = false;
    }
}

function slerpV(v1: Vec2, v2: Vec2, t: number) {
    return v1.slerp(v2, t);
}

export function createAnimation(name: string, json: EntityAnimData) {
    const { interrupt, cancel, loop, sticky, channels, shadow, autoplay } = json;
    const c = [];
    for (var channel of channels) {
        const frames: Keyframe<any>[] = [];
        const { target, keyframes, alpha, slerp, relative, delay } = channel;
        var isVec2 = false;
        for (var [len, value, easing] of keyframes) {
            if (len < 0) throw new Error(`invalid length (must be >=0): ${len} (on anim name ${name})`)
            frames.push({ x: Array.isArray(value) ? (typeof value[0] === "number" ? (([a, b]) => () => K.rand(a, b))(value as number[]) : typeof value[0] === "string" ? (([a, b]) => { const ca = K.rgb(a), cb = K.rgb(b); return () => K.rand(ca, cb); })(value as [string, string]) : (([{ x: x1, y: y1 }, { x: x2, y: y2 }, spherical]) => spherical ? () => (K.RIGHT.rotate(K.rand(360)).scale(K.rand()).scale(x2 - x1, y2 - y1).add(x1, y1)) : (() => K.vec2(K.rand(x1, x2), K.rand(y1, y2))))(value as [XY, XY, boolean])) : (typeof value === "number" ? value : typeof value === "string" ? K.rgb(value) : K.vec2(value.x, value.y)), len, ease: (easing as any) === "none" ? () => 1 : K.easings[easing ?? "linear"] }); // ridiculously long line
        }
        c.push(new AnimChannel(target, loop, sticky, alpha, frames as any, isVec2 && slerp ? slerpV as any : K.lerp, relative, delay));
    }
    return [new Animation(name, c, interrupt, cancel, shadow), autoplay] as const;
}
