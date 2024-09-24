import { CompList } from "kaplay";
import K from "../init";
import { defaults } from "./default";

export function wall(): CompList<any> {
    return [
        K.sprite("steel"),
        K.body({ isStatic: true }),
        K.tile({ isObstacle: true }),
        ...defaults(),
        "wall",
    ]
}
