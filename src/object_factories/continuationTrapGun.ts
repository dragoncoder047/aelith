import { CompList, Tag } from "kaplay";
import { continuationTrapCore } from "../components/continuationTrap";
import { grabbable } from "../components/grabbable";
import { holdOffset } from "../components/holdOffset";
import { interactable } from "../components/interactable";
import { FRICTION, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { throwablePlatformEff } from "./throwablePlatformEff";

export function continuationTrap(): CompList<any> {
    return [
        K.sprite("continuation_trap"),
        K.body({ maxVelocity: TERMINAL_VELOCITY }),
        ...defaults({
            scale: K.vec2((TILE_SIZE - 4) / TILE_SIZE, 1),
            friction: FRICTION / 8,
            restitution: RESTITUTION,
            collisionIgnore: ["inInventory"]
        }),
        K.shader("recolorRed", {
            u_targetcolor: K.RED,
        }),
        K.offscreen({ hide: true }),
        K.opacity(1),
        continuationTrapCore("capture"),
        interactable(),
        grabbable("&msg.ctlHint.item.trap.grab"),
        K.z(100),
        holdOffset(K.vec2(-TILE_SIZE / 6, -TILE_SIZE / 12)),
        K.named("{undefined}"),
        ...throwablePlatformEff(),
        "continuationTrap" as Tag,
        "saveable" as Tag,
    ];
}
