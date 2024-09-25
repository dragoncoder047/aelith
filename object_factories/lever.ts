import { CompList } from "kaplay";
import { K } from "../init";

import { spriteToggle } from "../components/spriteToggle";
import { machine } from "./machine";
import { hoverOutline } from "../components/hoverOutline";
import { toggleSwitch } from "../components/toggleSwitch";
import { clicky } from "../components/click_noise";

export function lever(): CompList<any> {
    return [
        K.sprite("lever"),
        spriteToggle(),
        ...machine(),
        hoverOutline(),
        K.anchor("bot"),
        toggleSwitch(),
        clicky(),
    ];
}
