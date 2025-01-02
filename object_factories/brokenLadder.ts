import { Tag } from "kaplay";
import { randomFrame } from "../components/randomFrame";
import { K } from "../init";
import { defaults } from "./default";

export function brokenLadder() {
    return [
        K.sprite("broken_ladder"),
        ...defaults({ collisionIgnore: ["*"] }),
        K.offscreen({ hide: true }),
        randomFrame(),
        "ladder" as Tag,
        "raycastIgnore" as Tag,
    ];
}
