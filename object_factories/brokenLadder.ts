import { GameObj, Tag } from "kaplay";
import { randomFrame } from "../components/randomFrame";
import { K } from "../init";
import { defaults } from "./default";

export function brokenLadder() {
    return [
        K.sprite("broken_ladder"),
        ...defaults(),
        K.offscreen({ hide: true }),
        randomFrame(),
        "raycastIgnore" as Tag,
        {
            add(this: GameObj) {
                this.unuse("area");
            }
        }
    ];
}
