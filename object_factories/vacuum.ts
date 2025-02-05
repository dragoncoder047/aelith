import { Tag } from "kaplay";
import { vacuumComp } from "../components/vacuum";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";

export function vacuum() {
    return [
        K.uvquad(TILE_SIZE, TILE_SIZE),
        "vacuum" as Tag,
        "raycastIgnore" as Tag,
        K.opacity(0),
        ...machine(),
        K.tile({ isObstacle: true }),
        vacuumComp(),
    ];
}
