/**
 * Toggles between frames when states change.
 * @param {string[]} [states=["off", "on"]]
 */
export function spriteToggle(states = ["off", "on"]) {
    return {
        id: "sprite-toggle",
        require: ["state", "sprite"],
        /**
         * @this {import("kaplay").GameObj<import("kaplay").StateComp | import("kaplay").SpriteComp | SpriteToggleComp>}
         */
        add() {
            states.forEach((state, i) => {
                this.onStateEnter(state, () => {
                    if (this.getCurAnim()) this.stop();
                    this.frame = i;
                });
            });
        },
        inspect() {
            return "sprite-toggle: " + states.join(":");
        }
    };
}
