import { Tag } from "kaplay";
import { mergeable } from "../components/mergeable";
import { pseudo3D } from "../components/pseudo3D";
import { BG_WALL_OPACITY, FRICTION } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { litShaderHelper } from "../components/light_helpers";

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
        pseudo3D(true),
        K.layer("background"),
        K.sprite("steel", { tiled: true }),
        litShaderHelper(),
        K.body({ isStatic: true }),
        mergeable(),
    ]
}
