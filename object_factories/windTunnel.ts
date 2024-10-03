import { TILE_SIZE, WIND_FORCE } from "../constants";
import { wind } from "../components/wind";
import { CompList } from "kaplay";
import { K } from "../init";
import { machine } from "./machine";

export function windTunnel(): CompList<any> {
    return [
        K.rect(TILE_SIZE, TILE_SIZE),
        K.color(K.getBackground()!),
        ...machine(),
        wind(),
        K.outline(0),
        K.areaEffector({
            forceAngle: -90,
            forceMagnitude: WIND_FORCE
        })
    ];
}
