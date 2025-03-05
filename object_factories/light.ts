import { Tag } from "kaplay";
import { spriteToggle } from "../components/spriteToggle";
import { K } from "../init";
import { machine } from "./machine";

export function light() {
    return [
        K.sprite("light"),
        spriteToggle(),
        ...machine(),
        K.anchor("bot"),
        "raycastIgnore" as Tag,
    ]
}

