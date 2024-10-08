import { CompList } from "kaplay";
import { K } from "../init";

import { spriteToggle } from "../components/spriteToggle";
import { nudge } from "../components/nudge";
import { machine } from "./machine";
import { clicky } from "../components/click_noise";
import { button as buttonComp } from "../components/button";
import { FRICTION } from "../constants";

export function button(): CompList<any> {
    return [
        K.sprite("button"),
        spriteToggle(),
        nudge(0, 12),
        ...machine({ offset: K.vec2(0, 3), friction: FRICTION }),
        K.body({ isStatic: true }),
        buttonComp(),
        clicky(),
    ];
}
