import { GameObj, StateComp } from "kaplay";

/**
 * Component that implements a machine that toggles state when it receives the "toggle" message.
 */
export function toggler(falseState: string = "off", trueState: string = "on", initialState: boolean = false, toggleMsg: string = "toggle") {
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
        add(this: GameObj<StateComp>) {
            this._syncState();
            this.onMessage(msg => {
                if (msg == this.toggleMsg) {
                    this.togglerState = !this.togglerState;
                    this._syncState();
                }
            });
        },
        _syncState(this: GameObj<StateComp>) {
            var targetState = this.togglerState ? this.trueState : this.falseState;
            if (this.state != targetState) this.enterState(targetState);
        }
    };
}
