// This file is not named the same as the component it exports
// mostly because uBlock is an idiot and decides to block "clicky.js"
// even if it's a 1st party script
// XXX: I'm bundling everything now, does this still apply?

import { Comp, GameObj, PosComp, StateComp } from "kaplay";
import { BAP_OPTS } from "../constants";
import { player } from "../player";

export interface ClickyComp extends Comp {
}

/**
 * Plays a sound when the state changes.
 * @param states states to look at
 */
export function clicky(states: string[] = ["off", "on"]): ClickyComp {
    return {
        id: "clicky",
        require: ["state", "pos"],
        add(this: GameObj<StateComp | PosComp>) {
            states.forEach(state => {
                this.onStateEnter(state, () => {
                    player.playSound("bap", BAP_OPTS[state], this.worldPos()!);
                });
            });
        },
    };
}

// cSpell: ignore clicky kaplay
