import { CompList } from "kaplay";
import { FRICTION, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { mergeable } from "../components/mergeable";

export function barrier(): CompList<any> {
    return [
        K.body({ isStatic: true }),
        mergeable(),
        ...defaults({
            friction: FRICTION,
            shape: new K.Rect(K.vec2(0), TILE_SIZE, TILE_SIZE),
        }),
        "barrier",
        "wall",
    ]
}
