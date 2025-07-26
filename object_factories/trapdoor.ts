import { Tag } from "kaplay";
import { clicky } from "../components/clicky";
import { interactable } from "../components/interactable";
import { rollingDoor } from "../components/rollingDoor";
import { K } from "../init";
import { machine } from "./machine";

export function trapdoor() {
    return [
        K.sprite("door_half", { fill: false }),
        "door" as Tag,
        K.body({ isStatic: true }),
        ...machine(),
        K.tile({ isObstacle: true }),
        interactable(),
        rollingDoor(),
        clicky(undefined, ["door_closing", "door_opening"]),
    ];
}

