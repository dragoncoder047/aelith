import { Comp, GameObj, SpriteComp, StateComp } from "kaplay";


export interface SpriteToggleComp extends Comp {
}

/**
 * Toggles between frames when states change.
 */
export function spriteToggle(states: string[] = ["off", "on"]): SpriteToggleComp {
    return {
        id: "sprite-toggle",
        require: ["state", "sprite"],
        add(this: GameObj<StateComp<(typeof states)[number]> | SpriteComp>) {
            states.forEach((state, i) => {
                this.onStateEnter(state, () => {
                    if (this.getCurAnim()) this.stop();
                    this.frame = i;
                });
            });
        },
        inspect() {
            return "sprite-toggle: " + states.join(", ");
        }
    };
}
