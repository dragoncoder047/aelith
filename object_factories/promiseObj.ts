import { BodyComp, GameObj, Tag } from "kaplay";
import { controllable } from "../components/controllable";
import { grabbable } from "../components/grabbable";
import { holdOffset } from "../components/holdOffset";
import { lore, LoreComp } from "../components/lore";
import { promise, PromiseComp } from "../components/promise";
import { FRICTION, RESTITUTION, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { throwablePlatformEff } from "./throwablePlatformEff";

export function promiseObj(controlling: PromiseComp["controlling"] & GameObj<LoreComp>) {
    return [
        K.sprite("promise", { anim: "normal" }),
        K.shader("recolor-red", {
            u_targetcolor: K.RED,
        }),
        K.offscreen({ hide: true }),
        K.anchor("center"),
        K.pos(),
        holdOffset(K.vec2(-2.8 * TILE_SIZE / 8, TILE_SIZE / 8)),
        ...defaults({
            collisionIgnore: ["tail", "player"],
            friction: FRICTION,
            restitution: RESTITUTION,
        }),
        K.body(),
        promise(controlling),
        ...throwablePlatformEff(),
        grabbable(),
        "continuation" as Tag,
        lore(controlling.lore),
    ];
}