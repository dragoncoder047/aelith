import { Tag } from "kaplay";
import { clicky } from "../components/clicky";
import { interactable } from "../components/interactable";
import { nudge } from "../components/nudge";
import { pseudo3D } from "../components/pseudo3D";
import { rollingDoor } from "../components/rollingDoor";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";

/**
 * Components for a rolling door.
 */
export function door() {
    return [
        pseudo3D(false, true),
        K.sprite("door", { fill: false }),
        "door" as Tag,
        K.body({ isStatic: true }),
        ...machine(),
        K.tile({ isObstacle: true }),
        interactable(),
        rollingDoor(),
        nudge(0, TILE_SIZE / 2),
        clicky(undefined, ["door_closing", "door_opening"]),
    ];
}
