import { Tag } from "kaplay";
import { mergeable } from "../components/mergeable";
import { FRICTION, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";

export function grating() {
    return [
        K.sprite("grating", { tiled: true }),
        K.layer("background"),
        K.body({ isStatic: true }),
        mergeable(),
        ...defaults({
            friction: FRICTION,
            scale: K.vec2(1, .6),
            offset: K.vec2(0, -TILE_SIZE / 5)
        }),
        "grating" as Tag,
    ]
}
