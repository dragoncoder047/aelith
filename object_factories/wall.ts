import { CompList } from "kaplay";
import { FRICTION } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { mergeable } from "../components/mergeable";

export function wall(): CompList<any> {
    return [
        K.sprite("steel", { tiled: true }),
        K.body({ isStatic: true }),
        mergeable(),
        ...defaults({ friction: FRICTION }),
        "wall",
    ]
}
