import { grabbable } from "../components/grabbable";
import { randomFrame } from "../components/randomFrame";
import { thudder } from "../components/thudder";
import { FRICTION, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";
import { throwablePlatformEff } from "./throwablePlatformEff";

/**
 * Components for a moveable, grabbable box.
 */
export function box() {
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
        K.named("var"),
        randomFrame(),
        ...throwablePlatformEff(),
    ];
}
