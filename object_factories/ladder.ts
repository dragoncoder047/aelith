import { Tag } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";

export function ladder() {
    return [
        K.sprite("ladder"),
        // override default with smaller shape to make
        // falling-off-the-ladder have more realistic bounds
        ...defaults({ scale: 4.0 / TILE_SIZE }),
        K.offscreen({ hide: true }),
        "ladder" as Tag,
        "raycastIgnore" as Tag,
    ];
}
