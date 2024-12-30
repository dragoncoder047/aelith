import { BodyComp, GameObj, RotateComp, Tag } from "kaplay";
import continuationTypes from "../assets/trapTypes.json" with { type: "json" };
import { continuationCore } from "../components/continuationCore";
import { ContinuationData, ContinuationTrapComp } from "../components/continuationTrap";
import { grabbable } from "../components/grabbable";
import { holdOffset } from "../components/holdOffset";
import { lore, LoreComp } from "../components/lore";
import { FRICTION, RESTITUTION, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { throwablePlatformEff } from "./throwablePlatformEff";

export function continuation(
    type: keyof typeof continuationTypes,
    captured: ContinuationData,
    trap: GameObj<ContinuationTrapComp | LoreComp>
) {
    return [
        K.sprite("continuation_invoker"),
        K.shader("recolor-red", {
            u_targetcolor: K.RED,
        }),
        K.offscreen({ hide: true }),
        K.anchor("center"),
        K.pos(captured.playerPos),
        holdOffset(K.vec2(-2.8 * TILE_SIZE / 8, TILE_SIZE / 8)),
        ...defaults({
            shape: new K.Circle(K.vec2(0), 8),
            collisionIgnore: ["tail"],
            friction: FRICTION,
            restitution: RESTITUTION,
        }),
        K.body(),
        K.named("{undefined}"),
        continuationCore(type, captured, trap),
        {
            add(this: GameObj<BodyComp>) {
                this.onBeforePhysicsResolve(coll => {
                    if (coll.target.is("player")) coll.preventResolution();
                });
            },
            update(this: GameObj<RotateComp>) {
                this.angle += 360 * K.dt();
            }
        },
        ...throwablePlatformEff(),
        grabbable(),
        "continuation" as Tag,
        lore(trap.lore),
    ];
}
