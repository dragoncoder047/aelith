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
        // these are set by wind comp
        K.areaEffector({ forceAngle: 0, forceMagnitude: 0 }),
        "raycastIgnore" as Tag,
    ];
}
