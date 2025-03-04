import { CompList, Tag } from "kaplay";
import { bug } from "../components/bug";
import { clicky } from "../components/clicky";
import { FRICTION, TERMINAL_VELOCITY } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { StateManager } from "../save_state";

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
        clicky(["scared"], ["bug_squeak"]),
        "bug" as Tag,
        "saveable" as Tag,
    ];
}

StateManager.registerReviver("bug", bugger);