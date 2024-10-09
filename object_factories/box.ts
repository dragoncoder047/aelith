import { CompList } from "kaplay";
import { boxComp } from "../components/box";
import { grabbable } from "../components/grabbable";
import { thudder } from "../components/thudder";
import { FRICTION, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";

import { machine } from "./machine";

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
        boxComp()
    ];
}
