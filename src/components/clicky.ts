import { Comp, GameObj, PosComp, StateComp } from "kaplay";
import { player } from "../player";

export interface ClickyComp extends Comp {
}

/**
 * Plays a sound when the state changes.
 * @param states states to look at
 */
export function clicky(states: string[] = ["off", "on"], sounds: string[] = ["switch_off", "switch_on"]): ClickyComp {
    return {
        id: "clicky",
        require: ["state", "pos"],
        add(this: GameObj<StateComp<(typeof states)[number]> | PosComp>) {
            states.forEach((state, i) => {
                this.onStateEnter(state, () => {
                    player.playSound(sounds[i]!, undefined, this.worldPos()!, undefined, this);
                });
            });
        },
    };
}

// cSpell: ignore clicky kaplay
