/**
 * Component that implements a machine that toggles state when it receives the "toggle" message.
 * @param {string} [falseState="off"]
 * @param {string} [trueState="on"]
 * @param {boolean} [initialState=false]
 * @param {string} [toggleMsg="toggle"]
 */
export function toggler(falseState = "off", trueState = "on", initialState = false, toggleMsg = "toggle") {
    var closure__state = initialState;
    return {
        id: "toggler",
        require: ["linked", "state"],
        falseState,
        trueState,
        toggleMsg,
        get togglerState() { return closure__state; },
        set togglerState(state) {
            closure__state = state;
            this._syncState();
        },
        /**
         * @this {import("kaplay").GameObj<LinkComp | import("kaplay").StateComp>}
         */
        add() {
            this._syncState();
            this.onMessage(msg => {
                if (msg == this.toggleMsg) {
                    this.togglerState = !this.togglerState;
                    this._syncState();
                }
            });
        },
        /**
         * @this {import("kaplay").GameObj<LinkComp | import("kaplay").StateComp>}
         */
        _syncState() {
            var targetState = this.togglerState ? this.trueState : this.falseState;
            if (this.state != targetState) this.enterState(targetState);
        }
    };
}
