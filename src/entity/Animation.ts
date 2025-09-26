import { EaseFunc, LerpValue } from "kaplay";

export enum AnimMode {
    LOOP_FOREVER = "loop",
    PLAY_ONCE_THEN_STOP = "once",
    PLAY_ONCE_THEN_STICKY = "sticky"
}


export class EntityAnimation {
    constructor(
        public name: string,
        public mode: AnimMode,
        public override: string[],
        public pingpong: boolean = false) { }
}

interface Keyframe<T extends LerpValue> {
    /** keyframe value */
    x: T | (() => T);
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
    running: boolean = true;
    constructor(public frames: Keyframe<T>[]) {}
}
