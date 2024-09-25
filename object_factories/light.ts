import { CompList } from "kaplay";
import { K } from "../init";

import { spriteToggle } from "../components/spriteToggle";
import { machine } from "./machine";

export function light(): CompList<any> {
    return [
        K.sprite("light"),
        spriteToggle(),
        ...machine(),
        K.anchor("bot"),
    ]
}
