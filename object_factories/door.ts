import { CompList } from "kaplay";
import { K } from "../init";

import { machine } from "./machine";
import { rollingDoor } from "../components/rollingDoor";
import { nudge } from "../components/nudge";
import { TILE_SIZE } from "../constants";
import { clicky } from "../components/click_noise";

/**
 * Components for a rolling door.
 */
export function door(): CompList<any> {
    return [
        K.sprite("door", { fill: false }),
        "door",
        K.body({ isStatic: true }),
        ...machine(),
        K.tile({ isObstacle: true }),
        rollingDoor(),
        nudge(0, TILE_SIZE / 2),
        clicky(undefined, ["door_closing", "door_opening"]),
    ];
}
