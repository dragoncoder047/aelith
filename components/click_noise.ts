// This file is not named the same as the component it exports
// mostly because uBlock is an idiot and decides to block "clicky.js"
// even if it's a 1st party script

import { Comp, GameObj, StateComp } from 'kaplay';
import { BAP_OPTS } from '../constants';
import { K } from "../init";

export interface ClickyComp extends Comp {
}

/**
 * Plays a sound when the state changes.
 * @param states states to look at
 */
export function clicky(states: string[] = ["off", "on"]): ClickyComp {
    return {
        id: "clicky",
        require: ["state"],
        add(this: GameObj<StateComp>) {
            states.forEach(state => {
                this.onStateEnter(state, () => {
                    K.play("bap", BAP_OPTS[state]?.());
                });
            });
        },
    };
}

// cSpell: ignore clicky kaplay
