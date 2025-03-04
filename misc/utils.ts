import { AreaComp, DrawCurveOpt, GameObj, RaycastResult, Vec2 } from "kaplay";
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

export function drawZapLine(p1: Vec2, p2: Vec2, opts: Partial<DrawCurveOpt> = {}, segSize: number = TILE_SIZE / 4, jitterSize: number = TILE_SIZE / 8) {
    const doubledScreenRect = new K.Rect(K.vec2(-K.width(), -K.height()), K.width() * 2, K.height() * 2);
    const clipped = new K.Line(p1, p2);
    K.clipLineToRect(doubledScreenRect, clipped, clipped);
    p1 = clipped.p1;
    p2 = clipped.p2;
    const numSegments = p1.sub(p2).len() / segSize;
    const jitter = () => K.rand(K.vec2(-jitterSize, -jitterSize), K.vec2(jitterSize, jitterSize));
    const f = (t: number) => K.lerp(p1, p2, t).add(jitter());
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

export function isTouchscreen() {
    return navigator.maxTouchPoints > 0;
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
