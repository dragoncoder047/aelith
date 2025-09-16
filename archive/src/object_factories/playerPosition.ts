import { Tag } from "kaplay";
import { K } from "../init";

/**
 * Dummy object - just used by MParser and friends to mark the
 * start location of the player. These are deleted after loading is
 * finished.
 * 
 * The appearance is a green square, so if world loading fails
 * they can easily be seen.
 */
export function playerPosition() {
    return [
        "playerPosition" as Tag,
        K.rect(10, 10),
        K.color(K.GREEN),
        K.anchor("center"),
        K.area(),
    ]
}
