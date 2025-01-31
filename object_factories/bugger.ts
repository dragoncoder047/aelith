import { CompList, Tag } from "kaplay";
import { bug } from "../components/bug";
import { FRICTION, TERMINAL_VELOCITY } from "../constants";
import { K } from "../init";
import { defaults } from "./default";

export function bugger(): CompList<any> {
    return [
        K.sprite("bug", { anim: "walk" }),
        K.body({ jumpForce: 200, maxVelocity: TERMINAL_VELOCITY }),
        K.layer("player"),
        K.state("sleeping"),
        ...defaults({
            friction: FRICTION,
            restitution: 0,
            collisionIgnore: ["tail", "continuation-trap"],
            scale: K.vec2(7 / 8, 1)
        }),
        K.offscreen({ hide: true }),
        K.shader("recolor-red", {
            u_targetcolor: K.RED,
        }),
        bug(),
        "bug" as Tag,
    ];
}
