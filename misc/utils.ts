import { AreaComp, DrawCurveOpt, GameObj, GameObjRaw, RaycastResult, Vec2 } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";

export function nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

export function actuallyRaycast(objects: GameObj<AreaComp>[], origin: Vec2, direction: Vec2, distance: number): RaycastResult {
    direction = direction.unit().scale(distance);
    var result: RaycastResult = null;
    for (var obj of objects) {
        const wa = obj.worldArea();
        const thisResult = wa.raycast(origin, direction);
        if (thisResult === null) continue;
        if (result === null || thisResult.fraction < result.fraction) {
            result = thisResult;
            result.object = obj;
        }
    }
    return result;
}

function hash(t: number) {
    return Math.sin(65432 * t);
}
function hashToPoint(t: number) {
    const rand1 = hash(t);
    const rand2 = hash(rand1);
    return K.vec2(K.lerp(0, 1, rand1), K.lerp(0, 1, rand2));
}

export function drawZapLine(p1: Vec2, p2: Vec2, opts: Omit<DrawCurveOpt, "segments"> = {}, staticRandom: number, twiddleSpeed = 65432, segSize = TILE_SIZE / 4, jitterSize = TILE_SIZE / 8) {
    const numSegments = p1.sub(p2).len() / segSize;
    const t = K.time() * twiddleSpeed;
    const tFloor = Math.floor(t);
    const tCeil = tFloor + 1;
    const r = hash(staticRandom);
    const jitter = (i: number) => K.lerp(hashToPoint(tFloor + i + r), hashToPoint(tCeil + i + r), t - tFloor).scale(jitterSize);
    const f = (t: number) => K.lerp(p1, p2, t).add(t === 0 || t === 1 ? K.vec2() : jitter(t * numSegments));
    K.drawCurve(f, { ...opts, segments: numSegments });
}

export function ballistics(pos: Vec2, vel: Vec2, t: number) {
    return pos.add(vel.scale(t)).add(K.getGravityDirection().scale(K.getGravity() * t * t / 2));
}

export function isFirefox() {
    // @ts-ignore
    return typeof window.mozInnerScreenX !== 'undefined';
}

export function guessOS() {
    const a = getUserAgentString().toLowerCase();
    return a.includes("mac") ? "mac" : a.includes("win") ? "windows" : "linux";
}

function getUserAgentString() {
    // @ts-ignore
    return navigator.userAgent || navigator.vendor || window.opera;
}
export type JSONSerializable =
    | number
    | boolean
    | string
    | null
    | { [key: string]: JSONSerializable; }
    | JSONSerializable[];

function is(obj: GameObj | null | undefined, field: "paused" | "fixed" | "hidden"): boolean {
    while (obj != null) {
        if (obj[field]) return true;
        obj = obj.parent;
    }
    return false;
};

export const isPaused = (obj: GameObj): boolean => is(obj, "paused");
export const isHidden = (obj: GameObj): boolean => is(obj, "hidden");
export function style(t: string, ss: string[]): string {
    return `${ss.map(s => `[${s}]`).join("")}${t}${ss.toReversed().map(s => `[/${s}]`).join("")}`;
}
