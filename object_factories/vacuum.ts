import { Tag } from "kaplay";
import { vacuumComp } from "../components/vacuum";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";
import { clicky } from "../components/clicky";

export function vacuum() {
    return [
        K.uvquad(TILE_SIZE, TILE_SIZE),
        "vacuum" as Tag,
        "raycastIgnore" as Tag,
        K.opacity(0),
        ...machine(),
        K.tile({ isObstacle: true }),
        vacuumComp(),
        clicky(["on"], ["vacuum_activate"]),
    ];
}
