import { GameObj, AreaComp, Vec2, RaycastResult } from "kaplay";
import { K } from "./init";

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

export function ballistics(pos: Vec2, vel: Vec2, t: number) {
    return pos.add(vel.scale(t)).add(K.getGravityDirection().scale(K.getGravity() * t * t / 2));
}

export function isFirefox() {
    // @ts-ignore
    return typeof window.mozInnerScreenX !== 'undefined';
}
