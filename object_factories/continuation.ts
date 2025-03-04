import { BodyComp, GameObj, RotateComp, Tag } from "kaplay";
import continuationTypes from "../assets/trapTypes.json" with { type: "json" };
import { continuationCore } from "../components/continuationCore";
import { ContinuationTrapComp } from "../components/continuationTrap";
import { LiveState } from "../save_state/live";
import { grabbable } from "../components/grabbable";
import { holdOffset } from "../components/holdOffset";
import { lore, LoreComp } from "../components/lore";
import { FRICTION, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { throwablePlatformEff } from "./throwablePlatformEff";
import { StateManager } from "../save_state";

export function continuation(
    type: keyof typeof continuationTypes,
    captured: LiveState,
    trap: GameObj<ContinuationTrapComp | LoreComp>
) {
    return [
        K.sprite("continuation_invoker"),
        K.shader("recolorRed", {
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
        K.body({ maxVelocity: TERMINAL_VELOCITY }),
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
        "saveable" as Tag,
        { reviver: "continuation" }
    ];
}

StateManager.registerReviver("continuation", continuation);
