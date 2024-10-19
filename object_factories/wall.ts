import { FRICTION } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { mergeable } from "../components/mergeable";
import { Tag } from "kaplay";

export function wall() {
    return [
        K.sprite("steel", { tiled: true }),
        K.body({ isStatic: true }),
        mergeable(),
        ...defaults({ friction: FRICTION }),
        "wall" as Tag,
    ]
}
