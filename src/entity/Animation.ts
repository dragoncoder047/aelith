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
    /** index into the keyframes array */
    i: number = 0;
    /** relative time into the current keyframe */
    relT: number = 0;
    inProgress: boolean = false;
    _initial: T | undefined;
    constructor(
        public target: string[],
        public loop: boolean = false,
        public sticky: boolean = true,
        public alpha: number = 10,
        public keyframes: Keyframe<T>[],
        public interpolation: (a: T, b: T, progress: number) => T) {
        if (this.keyframes.length < 2) throw new Error("anim needs at least 2 keyframes!");
        for (var kf of this.keyframes) {
            kf._cx = (typeof kf.x === "function") ? kf._cx = kf.x() : kf.x;
        }
    }
    start(obj: any) {
        this.rewind();
        this.inProgress = true;
        this.maybeSaveInitial(obj);
    }
    maybeSaveInitial(obj: any) {
        if (this.sticky) return;
        for (var i = 0; i < this.target.length && obj; i++) {
            obj = obj[this.target[i]!];
        }
        this._initial = obj;
    }
    update(dt: number): T {
        this.relT += dt;
        const [f1, f2, alpha] = this.updateIAndT();
        if (!this.inProgress) return this.keyframes.at(-1)!._cx!;
        return this.interpolation(f1!, f2!, alpha);
    }
    rewind() {
        this.i = this.relT = 0;
        this.inProgress = true;
    }
    stop(obj: any) {
        this.inProgress = false;
        var x = this.sticky ? this.keyframes.at(-1)!._cx : this._initial;
        for (var i = 0; i < this.target.length - 1 && obj; i++) {
            obj = obj[this.target[i]!];
        }
        if (obj) obj[this.target[i]!] = x;
    }
    private updateIAndT() {
        var f: Keyframe<T>, f2: Keyframe<T>, numFrames = this.keyframes.length;
        var i2 = (this.i + 1) % numFrames;
        while (this.relT >= (f2 = this.keyframes[i2]!, f = this.keyframes[this.i]!).len) {
            this.relT -= f.len, this.i++, i2++;
            i2 %= numFrames;
            var f3 = this.keyframes[i2]!;
            f3._cx = typeof f3.x === "function" ? f3.x() : f3.x;
            if (this.i >= numFrames) {
                if (this.loop) this.i = 0;
                else { this.inProgress = false; return [, , 0] as const; }
            }
        }
        return [f._cx, f2._cx, this.relT / f.len] as const;
    }
}

export class Animation {
    _pausedBy: Set<Animation> = new Set;
    running = true;
    onEnd: KEvent = new K.KEvent;
    constructor(
        public name: string,
        public channels: AnimChannel<any>[],
        public override: string[] = [],
        public replace: string[] = []) { }
    start(obj: any) {
        for (var ch of this.channels) {
            ch.start(obj);
        }
        this.running = true;
    }
    update(dt: number) {
        return this.channels.map(c => [c.target, c.update(dt), c.alpha] as [string[], any, number]);
    }
    finished() {
        return this.channels.every(c => !c.inProgress);
    }
    stop(obj: any) {
        this.channels.forEach(c => c.stop(obj));
        this.onEnd.trigger();
        this.onEnd.clear();
        this._pausedBy = new Set;
        this.running = false;
    }
    pauseFor(anim: Animation) {
        this.running = false;
        this._pausedBy.add(anim);
    }
    maybeUnpauseFor(anim: Animation) {
        if (this._pausedBy.has(anim)) {
            this._pausedBy.delete(anim);
            this.running = this._pausedBy.size === 0;
        }
    }
}

function slerpV(v1: Vec2, v2: Vec2, t: number) {
    return v1.slerp(v2, t);
}

export function createAnimation(name: string, json: EntityAnimData) {
    const { override, replace, loop, sticky, channels } = json;
    const c = [];
    for (var channel of channels) {
        const frames: Keyframe<any>[] = [];
        const { target, keyframes, alpha, slerp } = channel;
        var isVec2 = false;
        for (var [len, value, easing] of keyframes) {
            frames.push({ x: Array.isArray(value) ? (typeof value[0] === "number" ? (([a, b]) => () => K.rand(a, b))(value as number[]) : typeof value[0] === "string" ? (([a, b]) => { const ca = K.rgb(a), cb = K.rgb(b); return () => K.rand(ca, cb); })(value as [string, string]) : (([{ x: x1, y: y1 }, { x: x2, y: y2 }, spherical]) => spherical ? () => (K.RIGHT.rotate(K.rand(360)).scale(K.rand()).scale(x2 - x1, y2 - y1).add(x1, y1)) : (() => K.vec2(K.rand(x1, x2), K.rand(y1, y2))))(value as [XY, XY, boolean])) : (typeof value === "number" ? value : typeof value === "string" ? K.rgb(value) : K.vec2(value.x, value.y)), len, ease: (easing as any) === "none" ? () => 1 : K.easings[easing ?? "linear"] }); // ridiculously long line
        }
        c.push(new AnimChannel(target, loop, sticky, alpha, frames as any, isVec2 && slerp ? slerpV as any : K.lerp));
    }
    return new Animation(name, c, override, replace);
}
