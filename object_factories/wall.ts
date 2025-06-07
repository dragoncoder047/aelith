import { BG_WALL_OPACITY, FRICTION } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { mergeable } from "../components/mergeable";
import { Tag } from "kaplay";

export function wall() {
    return [
        ...wallCommon(),
        ...defaults({ friction: FRICTION, collisionIgnore: ["wall"] }), // micro-optimization
        "wall" as Tag,
    ]
}

export function bgWall() {
    return [
        ...wallCommon(),
        K.opacity(BG_WALL_OPACITY),
        K.anchor("center"),
        K.timer(),
        K.tile({ isObstacle: true }),
        K.rotate(0),
    ]
}

function wallCommon() {
    return [
        K.layer("background"),
        K.sprite("steel", { tiled: true }),
        K.body({ isStatic: true }),
        mergeable(),
    ]
}
