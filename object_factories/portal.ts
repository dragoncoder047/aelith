import { Tag } from "kaplay";
import { mergeable } from "../components/mergeable";
import { portalComp } from "../components/portal";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";

export function portal() {
    return [
        K.uvquad(TILE_SIZE, TILE_SIZE),
        "portal" as Tag,
        ...defaults(),
        K.tile({ isObstacle: true }),
        K.body({ isStatic: true }),
        K.platformEffector({ ignoreSides: [] }),
        portalComp(),
        mergeable(),
        K.named("undefined"),
        "raycastIgnore",
        "noCollideWithTail",
    ];
}

