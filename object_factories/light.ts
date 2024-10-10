import { CompList } from "kaplay";
import { spriteToggle } from "../components/spriteToggle";
import { K } from "../init";
import { machine } from "./machine";

export function light(): CompList<any> {
    return [
        K.sprite("light"),
        spriteToggle(),
        ...machine(),
        K.anchor("bot"),
    ]
}
