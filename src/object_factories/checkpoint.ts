import { AreaComp, Comp, GameObj, Tag } from "kaplay";
import { ContinuationTrapComp, continuationTrapCore } from "../components/continuationTrap";
import { interactable, InteractableComp } from "../components/interactable";
import { lightComp } from "../components/light_helpers";
import { nudge } from "../components/nudge";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";

export function checkpoint() {
    return [
        K.sprite("checkpoint"),
        ...defaults(),
        K.tile({ isObstacle: false }),
        nudge(K.vec2(0, TILE_SIZE / 2)),
        K.shader("recolorRed", {
            u_targetcolor: K.RED,
        }),
        interactable(),
        continuationTrapCore("checkpoint"),
        K.offscreen({ hide: true }),
        K.named("assert"),
        lightComp(K.vec2(0, -TILE_SIZE * 2 / 3)),
        {
            add(this: GameObj<AreaComp | ContinuationTrapComp | InteractableComp>) {
                this.onCollide("player", () => {
                    this.action1!();
                });
            }
        } as Comp,
        "raycastIgnore" as Tag,
        "checkpoint" as Tag,
        "saveable" as Tag,
    ];
}
