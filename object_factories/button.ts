import { Tag } from "kaplay";
import { button as buttonComp } from "../components/button";
import { clicky } from "../components/clicky";
import { nudge } from "../components/nudge";
import { spriteToggle } from "../components/spriteToggle";
import { FRICTION } from "../constants";
import { K } from "../init";
import { machine } from "./machine";
import { collisioner } from "../components/collisioner";

export function button() {
    return [
        K.sprite("button"),
        spriteToggle(),
        nudge(0, 12),
        ...machine({
            offset: K.vec2(0, 3),
            friction: FRICTION,
            collisionIgnore: ["continuation-trap"]
        }),
        K.body({ isStatic: true }),
        buttonComp(),
        collisioner(),
        clicky(),
        "noCollideWithTail" as Tag,
    ];
}
