import { Tag } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";

export function windEnd() {
    return [
        K.rect(TILE_SIZE, TILE_SIZE),
        K.area(),
        ...machine(),
        "windEnd" as Tag
    ]
}
