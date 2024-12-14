import { trap } from "../components/continuationTrap";
import { grabbable } from "../components/grabbable";
import { holdOffset } from "../components/holdOffset";
import { lore } from "../components/lore";
import { FRICTION, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { throwablePlatformEff } from "./throwablePlatformEff";

export function continuationTrap() {
    return [
        K.sprite("continuation_trap"),
        K.body({ maxVelocity: TERMINAL_VELOCITY }),
        ...defaults({
            scale: K.vec2((TILE_SIZE - 4) / TILE_SIZE, 1),
            friction: FRICTION / 8,
            restitution: RESTITUTION
        }),
        K.shader("recolor-red", {
            u_targetcolor: K.RED,
        }),
        K.offscreen({ hide: true }),
        trap("capture"),
        K.layer("boxes"),
        grabbable(),
        holdOffset(K.vec2(-TILE_SIZE / 6, -TILE_SIZE / 12)),
        K.named("{undefined}"),
        ...throwablePlatformEff(),
        lore(),
    ];
}
