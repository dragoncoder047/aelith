import { Comp, GameObj, AreaComp, StateComp, SpriteComp } from "kaplay";
import { K } from "../init";
import { LinkComp } from "./linked";
import { TogglerComp } from "./toggler";
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
        }
    };
}
