import { FRICTION } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { mergeable } from "../components/mergeable";
import { Tag } from "kaplay";

export function wall() {
    return [
        K.layer("background1"),
        K.sprite("steel", { tiled: true }),
        K.body({ isStatic: true }),
        mergeable(),
        ...defaults({ friction: FRICTION, collisionIgnore: ["wall"] }), // micro-optimization
        "wall" as Tag,
    ]
}
