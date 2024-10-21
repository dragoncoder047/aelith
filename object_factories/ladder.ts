import { Tag } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";

export function ladder() {
    return [
        K.sprite("ladder"),
        ...defaults(),
        // override default with smaller shape to make
        // falling-off-the-ladder have more realistic bounds
        K.area({ scale: 1.0 / TILE_SIZE }),
        "ladder" as Tag,
        "raycastIgnore" as Tag,
    ];
}
