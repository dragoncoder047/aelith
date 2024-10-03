import { CompList } from "kaplay";
import { boxComp } from "../components/box";
import { grabbable } from "../components/grabbable";
import { hoverOutline } from "../components/hoverOutline";
import { thudder } from "../components/thudder";
import { DRAG, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";

import { machine } from "./machine";

/**
 * Components for a moveable, grabbable box.
 */
export function box(): CompList<any> {
    return [
        K.sprite("box", { fill: false }),
        "box",
        K.body({ maxVelocity: TERMINAL_VELOCITY, drag: DRAG }),
        // make box a teeny bit smaller so that it fits down holes
        // and I don't have to stomp on it
        ...machine({ scale: (TILE_SIZE - 1) / TILE_SIZE }),
        hoverOutline(),
        K.tile({ isObstacle: true }),
        thudder(),
        grabbable(),
        K.layer("boxes"),
        boxComp()
    ];
}
