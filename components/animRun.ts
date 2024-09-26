import { Comp, GameObj, SpriteComp, StateComp } from "kaplay";
import { TogglerComp } from "./toggler";


export interface AnimRunComp extends Comp {
}

/**
 * Runs or pauses an animation when states change.
 */
export function animRun(animName: string, states: [string, string] = ["off", "on"]): AnimRunComp {
    return {
        id: "anim-run",
        require: ["state", "sprite", "toggler"],
        add(this: GameObj<StateComp | SpriteComp | TogglerComp>) {
            this.onStateEnter(states[0], this.stop);
            this.onStateEnter(states[1], () => {
                this.play(animName);
            });
        },
    };
}
