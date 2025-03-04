import { Tag } from "kaplay";
import { spriteToggle } from "../components/spriteToggle";
import { K } from "../init";
import { machine } from "./machine";
import { StateManager } from "../save_state";

export function light() {
    return [
        K.sprite("light"),
        spriteToggle(),
        ...machine(),
        K.anchor("bot"),
        "raycastIgnore" as Tag,
        { reviver: "light" }
    ]
}

StateManager.registerReviver("light", light);
