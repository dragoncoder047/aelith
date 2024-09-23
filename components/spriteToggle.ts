import { GameObj, SpriteComp, StateComp } from "kaplay";

/**
 * Toggles between frames when states change.
 */
export function spriteToggle(states: [string, string] = ["off", "on"]) {
    return {
        id: "sprite-toggle",
        require: ["state", "sprite"],
        add(this: GameObj<StateComp | SpriteComp>) {
            states.forEach((state, i) => {
                this.onStateEnter(state, () => {
                    if (this.getCurAnim()) this.stop();
                    this.frame = i;
                });
            });
        },
        inspect() {
            return "sprite-toggle: " + states.join(" <-> ");
        }
    };
}
