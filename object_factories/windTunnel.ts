import { Tag } from "kaplay";
import { wind } from "../components/wind";
import { TILE_SIZE, WIND_FORCE } from "../constants";
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
        K.areaEffector({
            forceAngle: -90,
            forceMagnitude: WIND_FORCE
        }),
        "raycastIgnore" as Tag,
    ];
}
