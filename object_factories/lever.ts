import { CompList } from "kaplay";
import { K } from "../init";

import { spriteToggle } from "../components/spriteToggle";
import { machine } from "./machine";
import { toggleSwitch } from "../components/toggleSwitch";
import { clicky } from "../components/click_noise";

export function lever(): CompList<any> {
    return [
        K.sprite("lever"),
        spriteToggle(),
        ...machine(),
        K.anchor("bot"),
        toggleSwitch(),
        clicky(),
        "lever"
    ];
}
