import { AreaComp, Comp, GameObj, PosComp } from "kaplay";
import { InteractableComp } from "./interactable";
import { LinkComp } from "./linked";

export interface TogglerSwitchComp extends Comp {
}

/**
 * Object that switches state when clicked.
 */
export function toggleSwitch(msg: string = "toggle"): TogglerSwitchComp {
    return {
        id: "toggleSwitch",
        require: ["linked", "area", "interactable"],
        add(this: GameObj<InteractableComp | AreaComp | PosComp | LinkComp>) {
            this.target1 = () => {
                this.broadcast(msg);
                this.trigger("pull");
                return true;
            };
            this.target1Hint = "&msg.ctlHint.item.switch.switch";
        }
    };
}
