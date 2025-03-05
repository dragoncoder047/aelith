import { Tag } from "kaplay";
import { clicky } from "../components/clicky";
import { spriteToggle } from "../components/spriteToggle";
import { toggleSwitch } from "../components/toggleSwitch";
import { K } from "../init";
import { machine } from "./machine";

export function lever() {
    return [
        K.sprite("lever"),
        spriteToggle(),
        ...machine(),
        K.anchor("bot"),
        toggleSwitch(),
        clicky(),
        "lever" as Tag,
        "interactable" as Tag,
    ];
}
