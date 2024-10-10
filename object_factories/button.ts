import { CompList } from "kaplay";
import { button as buttonComp } from "../components/button";
import { clicky } from "../components/click_noise";
import { nudge } from "../components/nudge";
import { spriteToggle } from "../components/spriteToggle";
import { FRICTION } from "../constants";
import { K } from "../init";
import { machine } from "./machine";

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
