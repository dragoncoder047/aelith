import { player } from '../main.js';

/**
 * Object that switches state when clicked.
 * @param {string} [msg="toggle"]
 */
export function toggleSwitch(msg = "toggle") {
    return {
        id: "toggleSwitch",
        require: ["linked", "area"],
        add() {
            this.onClick(() => {
                if (player.canTouch(this)) this.broadcast(msg);
            });
        }
    };
}
