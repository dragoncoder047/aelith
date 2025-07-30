import { Tag } from "kaplay";
import { button as buttonComp } from "../components/button";
import { clicky } from "../components/clicky";
import { collisioner } from "../components/collisioner";
import { nudge } from "../components/nudge";
import { spriteToggle } from "../components/spriteToggle";
import { FRICTION } from "../constants";
import { K } from "../init";
import { machine } from "./machine";

export function button() {
    return [
        K.sprite("button"),
        spriteToggle(),
        nudge(0, 12),
        ...machine({
            offset: K.vec2(0, 3),
            friction: FRICTION,
            collisionIgnore: ["continuation-trap", "continuation", "particle"]
        }),
        K.body({ isStatic: true }),
        buttonComp(),
        collisioner(),
        clicky(),
        "noCollideWithTail" as Tag,
        "2.5D" as Tag,
    ];
}
