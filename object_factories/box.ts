import { CompList, Vec2 } from "kaplay";
import { grabbable } from "../components/grabbable";
import { randomFrame } from "../components/randomFrame";
import { thudder } from "../components/thudder";
import { FRICTION, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { machine } from "./machine";

// async import
var getMotionVector: () => Vec2;
import("../player/controls/impl").then(m => getMotionVector = m.getMotionVector);

/**
 * Components for a moveable, grabbable box.
 */
export function box(): CompList<any> {
    return [
        K.sprite("box", { fill: false }),
        "box",
        K.body({ maxVelocity: TERMINAL_VELOCITY }),
        ...machine({
            // make box a teeny bit smaller so that it fits down holes
            // and I don't have to stomp on it
            scale: (TILE_SIZE - 1) / TILE_SIZE,
            friction: FRICTION,
            restitution: RESTITUTION
        }),
        K.tile({ isObstacle: true }),
        thudder(),
        grabbable(),
        K.layer("boxes"),
        K.named("box"),
        randomFrame(),
        K.platformEffector({
            shouldCollide(obj, normal) {
                if (obj !== player) return true;
                if (K.UP.eq(normal)) return false;
                if (getMotionVector().slen() > 1.3) return true;
                if (K.LEFT.eq(normal)) return false;
                if (K.RIGHT.eq(normal)) return false;
                return true;
            },
        }),
        "noCollideWithTail",
    ];
}
