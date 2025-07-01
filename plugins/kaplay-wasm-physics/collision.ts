import { GameObj, KAPLAYCtx, Vec2 } from "kaplay";

export function makeCollisionClass(k: KAPLAYCtx) {
    return class Collision {
        source: GameObj;
        target: GameObj;
        normal: Vec2;
        distance: number;
        resolved: boolean = false;
        constructor(
            source: GameObj,
            target: GameObj,
            normal: Vec2,
            distance: number,
            resolved = false,
        ) {
            this.source = source;
            this.target = target;
            this.normal = normal;
            this.distance = distance;
            this.resolved = resolved;
        }
        get displacement() {
            return this.normal.scale(this.distance);
        }
        reverse() {
            return new Collision(
                this.target,
                this.source,
                this.normal.scale(-1),
                this.distance,
                this.resolved,
            );
        }
        hasOverlap() {
            return this.distance > 0;
        }
        isLeft() {
            return this.normal.cross(k._k.game.gravity || k.vec2(0, 1)) > 0;
        }
        isRight() {
            return this.normal.cross(k._k.game.gravity || k.vec2(0, 1)) < 0;
        }
        isTop() {
            return this.normal.dot(k._k.game.gravity || k.vec2(0, 1)) > 0;
        }
        isBottom() {
            return this.normal.dot(k._k.game.gravity || k.vec2(0, 1)) < 0;
        }
        preventResolution() {
            this.resolved = true;
        }
    }
}
