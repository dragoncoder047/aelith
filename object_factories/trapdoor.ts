import { Tag } from "kaplay";
import { clicky } from "../components/clicky";
import { rollingDoor } from "../components/rollingDoor";
import { K } from "../init";
import { machine } from "./machine";
import { StateManager } from "../save_state";

export function trapdoor() {
    return [
        K.sprite("door_half", { fill: false }),
        "door" as Tag,
        K.body({ isStatic: true }),
        ...machine(),
        K.tile({ isObstacle: true }),
        rollingDoor(),
        clicky(undefined, ["door_closing", "door_opening"]),
    ];
}

