import { FRICTION, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { mergeable } from "../components/mergeable";

export function barrier() {
    return [
        K.body({ isStatic: true }),
        K.rect(TILE_SIZE, TILE_SIZE),
        K.opacity(0),
        mergeable(),
        ...defaults({ friction: FRICTION }),
        "barrier",
    ]
}
