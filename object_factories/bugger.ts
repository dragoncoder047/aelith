import { CompList } from "kaplay";
import { K } from "../init";
import { bug } from "../components/bug";
import { defaults } from "./default";
import { FRICTION, RESTITUTION, TILE_SIZE } from "../constants";

export function bugger(): CompList<any> {
    return [
        K.sprite("bug", { anim: "walk" }),
        K.body({ jumpForce: 200 }),
        K.layer("player"),
        K.state("sleeping"),
        ...defaults({
            friction: FRICTION,
            restitution: RESTITUTION,
            collisionIgnore: ["tail", "continuation-trap"],
            scale: K.vec2(7 / 8, 1)
        }),
        K.offscreen({ hide: true }),
        K.shader("recolor-red", {
            u_targetcolor: K.RED,
        }),
        bug(),
    ];
}
