import { AreaComp, Comp, GameObj, Tag } from "kaplay";
import { ContinuationTrapComp, trap } from "../components/continuationTrap";
import { K } from "../init";
import { defaults } from "./default";
import { nudge } from "../components/nudge";
import { TILE_SIZE } from "../constants";
import { lore } from "../components/lore";

export function checkpoint() {
    return [
        K.sprite("checkpoint"),
        ...defaults(),
        K.tile({ isObstacle: false }),
        nudge(0, TILE_SIZE / 2),
        K.shader("recolor-red", {
            u_targetcolor: K.RED,
        }),
        trap("checkpoint"),
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
        "checkpoint" as Tag
    ];
}
