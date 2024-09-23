import { AreaComp, GameObj } from 'kaplay';
import { player } from '../main';

/**
 * Object that switches state when clicked.
 */
export function toggleSwitch(msg: string = "toggle") {
    return {
        id: "toggleSwitch",
        require: ["linked", "area"],
        add(this: GameObj<AreaComp>) {
            this.onClick(() => {
                if (player.canTouch(this)) this.broadcast(msg);
            });
        }
    };
}
