import { Tag } from "kaplay";
import { mergeable } from "../components/mergeable";
import { FRICTION } from "../constants";
import { K } from "../init";
import { defaults } from "./default";

export function grating() {
    return [
        K.sprite("grating", { tiled: true }),
        K.layer("background"),
        K.body({ isStatic: true }),
        mergeable(),
        ...defaults({ friction: FRICTION }),
        "grating" as Tag,
        "raycastIgnore" as Tag,
    ]
}
