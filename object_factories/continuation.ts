import { BodyComp, GameObj, RotateComp, Tag } from "kaplay";
import continuationTypes from "../assets/trapTypes.yaml" with { type: "json" };
import { continuationCore } from "../components/continuationCore";
import { ContinuationTrapComp } from "../components/continuationTrap";
import { grabbable } from "../components/grabbable";
import { holdOffset } from "../components/holdOffset";
import { lore, LoreComp } from "../components/lore";
import { FRICTION, JUMP_FORCE, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { WorldSnapshot } from "../save_state/state";
import { defaults } from "./default";
import { throwablePlatformEff } from "./throwablePlatformEff";

export function continuation(
    type: keyof typeof continuationTypes,
    captured: WorldSnapshot,
    trap: GameObj<ContinuationTrapComp | LoreComp>
) {
    return [
        K.shader("recolorRed", {
            u_targetcolor: K.RED,
        }),
        K.offscreen({ hide: true }),
        K.anchor("center"),
        K.pos(captured.playerPos),
        holdOffset(K.vec2(-2.8 * TILE_SIZE / 8, TILE_SIZE / 8)),
        ...defaults({
            collisionIgnore: ["tail", "player", "player_head"],
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
        grabbable(),
        K.z(100),
        "continuation" as Tag,
        lore(trap.lore),
        "saveable" as Tag,
    ];
}
