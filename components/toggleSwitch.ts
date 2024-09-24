import { AreaComp, Comp, GameObj, PosComp } from 'kaplay';
import { player } from '../player';
import { LinkComp } from './linked';

export interface TogglerSwitchComp extends Comp {
}

/**
 * Object that switches state when clicked.
 */
export function toggleSwitch(msg: string = "toggle"): TogglerSwitchComp {
    return {
        id: "toggleSwitch",
        require: ["linked", "area"],
        add(this: GameObj<AreaComp | PosComp | LinkComp>) {
            this.onClick(() => {
                if (player.canTouch(this)) this.broadcast(msg);
            });
        }
    };
}
