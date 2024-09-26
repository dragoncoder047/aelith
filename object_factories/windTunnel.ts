import { TILE_SIZE, WIND_FORCE } from "../constants";
import { wind } from "../components/wind";
import { CompList } from "kaplay";
import { K } from "../init";
import { machine } from "./machine";
import { spriteToggle } from "../components/spriteToggle";

export function windTunnel(): CompList<any> {
    return [
        K.rect(TILE_SIZE, TILE_SIZE),
        K.color(K.getBackground()!),
        ...machine(),
        spriteToggle(),
        wind(),
        K.areaEffector({
            forceAngle: 90,
            forceMagnitude: WIND_FORCE
        })
    ];
}
