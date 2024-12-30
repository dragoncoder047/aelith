import { Tag } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";

export function brokenLadder() {
    return [
        K.sprite("broken_ladder"),
        ...defaults({ collisionIgnore: ["*"] }),
        K.offscreen({ hide: true }),
        "ladder" as Tag,
        "raycastIgnore" as Tag,
    ];
}
