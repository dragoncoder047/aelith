import { AreaComp, Comp, GameObj, Tag } from "kaplay";
import { ContinuationTrapComp, continuationTrapCore } from "../components/continuationTrap";
import { lore } from "../components/lore";
import { nudge } from "../components/nudge";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { defaults } from "./default";

export function checkpoint() {
    return [
        K.sprite("checkpoint"),
        ...defaults(),
        K.tile({ isObstacle: false }),
        nudge(0, TILE_SIZE / 2),
        K.shader("recolorRed", {
            u_targetcolor: K.RED,
        }),
        continuationTrapCore("checkpoint"),
        K.offscreen({ hide: true }),
        K.named("assert"),
        lore(),
        {
            add(this: GameObj<AreaComp | ContinuationTrapComp>) {
                this.onCollide("player", () => {
                    this.trigger("invoke");
                });
            }
        } as Comp,
        "raycastIgnore" as Tag,
        "checkpoint" as Tag,
        "saveable" as Tag,
    ];
}
