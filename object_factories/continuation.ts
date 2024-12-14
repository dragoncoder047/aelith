import { GameObj } from "kaplay";
import continuationTypes from "../assets/trapTypes.json" with { type: "json" };
import { continuationCore } from "../components/continuationCore";
import { ContinuationData, ContinuationTrapComp } from "../components/continuationTrap";
import { K } from "../init";
import { defaults } from "./default";
import { holdOffset } from "../components/holdOffset";
import { TILE_SIZE } from "../constants";

export function continuation(
    type: keyof typeof continuationTypes,
    captured: ContinuationData,
    trap: GameObj<ContinuationTrapComp>
) {
    return [
        K.sprite("continuation", { anim: "spin" }),
        K.shader("recolor-red", {
            u_targetcolor: K.RED,
        }),
        K.offscreen({ hide: true }),
        K.anchor("center"),
        K.pos(captured.playerPos),
        holdOffset(K.vec2(-2.8 * TILE_SIZE / 8, TILE_SIZE / 8)),
        ...defaults(),
        K.named("{undefined}"),
        continuationCore(type, captured, trap),
    ];
}
