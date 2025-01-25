import { FRICTION } from "../constants";
import { K } from "../init";
import { defaults } from "./default";
import { mergeable } from "../components/mergeable";
import { BodyComp, GameObj, Tag } from "kaplay";
import { ContinuationTrapComp } from "../components/continuationTrap";

export function grating() {
    return [
        K.sprite("grating", { tiled: true }),
        K.body({ isStatic: true }),
        mergeable(),
        ...defaults({ friction: FRICTION }),
        "grating" as Tag,
        "raycastIgnore" as Tag,
        {
            add(this: GameObj<BodyComp>) {
                this.onBeforePhysicsResolve(col => {
                    const obj = col.target;
                    if (obj.has("continuation-trap")) {
                        const trap = obj as GameObj<ContinuationTrapComp>;
                        if (trap.enabled && !trap.isDeferring)
                            col.preventResolution();
                    }
                });
            }
        }
    ]
}
