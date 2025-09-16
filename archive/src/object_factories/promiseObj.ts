import { BodyComp, GameObj, Tag } from "kaplay";
import { grabbable } from "../components/grabbable";
import { holdOffset } from "../components/holdOffset";
import { interactable } from "../components/interactable";
import { promise, PromiseComp } from "../components/promise";
import { FRICTION, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { throwablePlatformEff } from "./throwablePlatformEff";

export function promiseObj(controlling: PromiseComp["controlling"]) {
    return [
        K.sprite("promise", { anim: "normal" }),
        K.shader("recolorRed", {
            u_targetcolor: K.RED,
        }),
        K.offscreen({ hide: true }),
        K.anchor("center"),
        K.pos(),
        holdOffset(K.vec2(-2.8 * TILE_SIZE / 8, TILE_SIZE / 8)),
        ...defaults({
            collisionIgnore: ["tail"],
            friction: FRICTION,
            restitution: RESTITUTION,
        }),
        K.body({ maxVelocity: TERMINAL_VELOCITY }),
        {
            add(this: GameObj<BodyComp>) {
                this.onBeforePhysicsResolve(coll => {
                    if (coll.target.is("player")) coll.preventResolution();
                });
            },
        },
        interactable(),
        grabbable("&msg.ctlHint.item.promise.grab"),
        promise(controlling, Object.assign({}, controlling.params)),
        ...throwablePlatformEff(),
        K.z(100),
        "continuation" as Tag,
        "saveable" as Tag,
    ];
}

