import { CompList, GameObj, Tag } from "kaplay";
import { continuationCore } from "../components/continuationCore";
import { ContinuationTrapComp } from "../components/continuationTrap";
import { grabbable } from "../components/grabbable";
import { holdOffset } from "../components/holdOffset";
import { interactable, InteractableComp } from "../components/interactable";
import { FRICTION, JUMP_FORCE, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { WorldSnapshot } from "../save_state/state";
import { defaults } from "./default";
import { throwablePlatformEff } from "./throwablePlatformEff";

export function continuation(
    type: string,
    captured: WorldSnapshot,
    trap: GameObj<ContinuationTrapComp | InteractableComp>
): CompList<any> {
    return [
        K.shader("recolorRed", {
            u_targetcolor: K.RED,
        }),
        K.offscreen({ hide: true }),
        K.anchor("center"),
        K.pos(captured.playerPos),
        holdOffset(K.vec2(-2.8 * TILE_SIZE / 8, TILE_SIZE / 8)),
        ...defaults({
            collisionIgnore: ["tail", "inInventory"],
            friction: FRICTION,
            restitution: RESTITUTION,
        }),
        K.body({
            maxVelocity: TERMINAL_VELOCITY,
            jumpForce: JUMP_FORCE / 2
        }),
        K.named("{undefined}"),
        continuationCore(type, captured, trap),
        K.sprite("continuation_invoker"), // must be after so sprite draws on top of line
        ...throwablePlatformEff(),
        interactable(),
        grabbable("&msg.ctlHint.item.continuation.grab"),
        K.z(100),
        "continuation" as Tag,
        "saveable" as Tag,
    ];
}
