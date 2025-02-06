import { BodyComp, GameObj } from "kaplay";
import { ContinuationTrapComp } from "../components/continuationTrap";
import { grating } from "./grating";

export function specialGrating() {
    return [
        ...grating(),
        {
            add(this: GameObj<BodyComp>) {
                this.onBeforePhysicsResolve(col => {
                    const obj = col.target;
                    if (obj.has("continuation-trap")) {
                        const trap = obj as GameObj<ContinuationTrapComp>;
                        if (trap.enabled && !trap.isDeferring)
                            col.preventResolution();
                    }
                    else if (obj.has("bug")) {
                        col.preventResolution();
                    }
                });
            }
        }
    ]
}
