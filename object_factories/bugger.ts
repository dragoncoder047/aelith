import { CompList, Tag } from "kaplay";
import { bug } from "../components/bug";
import { clicky } from "../components/clicky";
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
        K.shader("recolorRed", {
            u_targetcolor: K.RED,
        }),
        bug(),
        clicky(["scared", "stunned", "angry"], ["bug_squeak", "bug_splat", "bug_screech"]),
        "bug" as Tag,
        "interactable" as Tag,
    ];
}
