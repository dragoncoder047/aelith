import { Comp, GameObj, StateComp } from "kaplay";
import { K } from "../init";
import { LinkComp } from "./linked";

export interface TogglerComp extends Comp {
    falseState: string,
    trueState: string,
    toggleMsg: string,
    togglerState: boolean,
    _syncState(): void,
}

/**
 * Component that implements a machine that toggles state when it receives the "toggle" message.
 */
export function toggler(falseState: string = "off", trueState: string = "on", initialState: boolean = false, toggleMsg: string = "toggle"): TogglerComp {
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
        add(this: GameObj<StateComp | TogglerComp | LinkComp>) {
            const zz_dummy = K.onUpdate(() => {
                this._syncState();
                zz_dummy.cancel();
            });
            this.onMessage(msg => {
                if (msg == this.toggleMsg) {
                    this.togglerState = !this.togglerState;
                    // this._syncState(); // called implicitly by setter
                }
            });
        },
        _syncState(this: GameObj<StateComp | TogglerComp>) {
            var targetState = this.togglerState ? this.trueState : this.falseState;
            if (this.state != targetState) this.enterState(targetState);
        }
    };
}
