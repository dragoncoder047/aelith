import { Tag } from "kaplay";
import { wind } from "../components/wind";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";

export function windTunnel() {
    return [
        K.rect(TILE_SIZE, TILE_SIZE),
        K.opacity(0),
        ...machine({
            collisionIgnore: ["tail"]
        }),
        wind(),
        K.outline(0),
        // this is set by wind comp
        K.areaEffector({ force: K.vec2(0) }),
        "raycastIgnore" as Tag,
    ];
}
