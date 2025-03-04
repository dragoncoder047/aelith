import { Tag } from "kaplay";
import { clicky } from "../components/clicky";
import { invisibleTriggerComp } from "../components/invisibleTrigger";
import { vacuumComp } from "../components/vacuum";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";
import { StateManager } from "../save_state";

export function vacuum() {
    return [
        K.uvquad(TILE_SIZE, TILE_SIZE),
        "vacuum" as Tag,
        K.opacity(0),
        ...machine(),
        K.tile({ isObstacle: true }),
        vacuumComp(),
        invisibleTriggerComp(),
        clicky(["on"], ["vacuum_activate"]),
    ];
}

