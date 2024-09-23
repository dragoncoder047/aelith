// This file is not named the same as the component it exports
// mostly because uBlock is an idiot and decides to block "clicky.js"
// even if it's a 1st party script

import { BAP_OPTS } from '../constants';
import K from '../init';

/**
 * Plays a sound when the state changes.
 * @param {string[]} [states=["off", "on"]] states to look at
 */
export function clicky(states = ["off", "on"]) {
    return {
        id: "clicky",
        require: ["state"],
        /**
         * @this {import("kaplay").GameObj<import("kaplay").StateComp>}
         */
        add() {
            states.forEach(state => {
                this.onStateEnter(state, () => {
                    K.play("bap", BAP_OPTS[state]?.());
                });
            });
        },
    };
}

// cSpell: ignore clicky kaplay
