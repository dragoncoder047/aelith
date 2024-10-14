import { CompList } from "kaplay";
import { clicky } from "../components/clicky";
import { nudge } from "../components/nudge";
import { rollingDoor } from "../components/rollingDoor";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";

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
