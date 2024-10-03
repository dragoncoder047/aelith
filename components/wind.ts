import { Comp, GameObj, StateComp, AreaComp, BodyComp, PosComp } from "kaplay";
import { K } from "../init";
import { LinkComp } from "./linked";
import { TogglerComp } from "./toggler";
import { WALK_SPEED } from "../constants";
type AreaEffectorComp = ReturnType<typeof K.areaEffector>; // why is this necessary??

export interface WindComp extends Comp {
}

export function wind(states: [string, string] = ["off", "on"]): WindComp {
    return {
        id: "wind",
        require: ["areaEffector", "area", "state", "linked", "toggler"],
        add(this: GameObj<AreaEffectorComp | AreaComp | StateComp | LinkComp | TogglerComp>) {
            var forceSave = 0;
            this.onStateEnter(states[0], () => {
                forceSave = this.forceMagnitude;
                this.forceMagnitude = 0;
            });
            this.onStateEnter(states[1], () => {
                this.forceMagnitude = forceSave;
            });
            this.onCollideUpdate(obj => {
                if (this.forceMagnitude > 0
                        && obj.is(["body", "pos"])
                        && (obj as GameObj<BodyComp>).curPlatform() !== null) {
                    (obj as GameObj<PosComp>).move(0, -WALK_SPEED);
                    (obj as GameObj<BodyComp>).jump(Number.EPSILON);
                }
            });
        }
    };
}
