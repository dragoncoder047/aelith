import { CompList, Tag } from "kaplay";
import { mergeable } from "../components/mergeable";
import { FRICTION, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { crossover } from "../components/crossover";

export function crossing(): CompList<any> {
    return [
        K.body({ isStatic: true }),
        K.rect(TILE_SIZE, TILE_SIZE),
        K.opacity(0),
        mergeable(),
        ...defaults({ friction: FRICTION, collisionIgnore: ["tail"] }),
        K.offscreen({ hide: true }),
        crossover(),
        "crossover" as Tag,
        "raycastIgnore" as Tag,
    ]
}
