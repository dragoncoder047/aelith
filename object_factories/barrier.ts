import { Tag } from "kaplay";
import { mergeable } from "../components/mergeable";
import { FRICTION, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";

export function barrier() {
    return [
        K.body({ isStatic: true }),
        K.rect(TILE_SIZE, TILE_SIZE),
        K.opacity(0),
        mergeable(),
        ...defaults({ friction: FRICTION }),
        K.offscreen({ hide: true }),
        "barrier" as Tag,
    ]
}
