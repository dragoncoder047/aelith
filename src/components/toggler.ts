import { Comp, GameObj, KEvent, KEventController, StateComp } from "kaplay";
import { K } from "../init";
import { LinkComp } from "./linked";

export interface TogglerComp extends Comp {
    falseState: string,
    trueState: string,
    toggleMsg: string,
    togglerState: boolean,
}

/**
 * Component that implements a machine that toggles state when it receives the "toggle" message.
 */
export function toggler(falseState: string = "off", trueState: string = "on", initialState: boolean = false, toggleMsg: string = "toggle"): Omit<TogglerComp, "reviver"> {
    var shouldToggle = false;
    var meInitiator = false;
    return {
        id: "toggler",
        require: ["linked", "state"],
        falseState,
        trueState,
        toggleMsg,
        get togglerState() {
            return (this as any as GameObj<StateComp<string>>).state === this.trueState;
        },
        set togglerState(state) {
            if (state) {
                if ((this as any as GameObj<StateComp<string>>).state !== this.trueState) (this as any as GameObj<StateComp<string>>).enterState(this.trueState);
            } else {
                if ((this as any as GameObj<StateComp<string>>).state !== this.falseState) (this as any as GameObj<StateComp<string>>).enterState(this.falseState);
            }
        },
        add(this: GameObj<StateComp<typeof falseState | typeof trueState> | TogglerComp | LinkComp>) {
            this.togglerState = initialState;
            this.on("broadcasted", (msg: string) => {
                if (msg === this.toggleMsg) meInitiator = true;
            });
            this.onMessage(msg => {
                if (msg == this.toggleMsg) {
                    shouldToggle = true;
                }
            });
        },
        update(this: GameObj<TogglerComp>) {
            if (shouldToggle) {
                if (meInitiator) this.trigger("toggleInitiate");
                shouldToggle = false;
                meInitiator = false;
                this.togglerState = !this.togglerState;
                this.trigger("toggle");
            }
        }
    };
}
