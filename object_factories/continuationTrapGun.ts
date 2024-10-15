import { CompList } from "kaplay";
import { K } from "../init";
import { defaults } from "./default";
import { trap } from "../components/continuationTrap";
import { grabbable } from "../components/grabbable";
import { FRICTION, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";

export function continuationTrap(): CompList<any> {
    return [
        K.sprite("continuation_trap"),
        K.body({ maxVelocity: TERMINAL_VELOCITY }),
        ...defaults({
            friction: FRICTION,
            restitution: RESTITUTION
        }),
        K.shader("recolor-red", {
            u_targetcolor: K.RED,
        }),
        trap(),
        grabbable(),
        K.layer("boxes"),
        K.named("{undefined}"),
        K.platformEffector({ ignoreSides: [] }),
        "throwable",
    ];
}