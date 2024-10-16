import { AreaComp, Comp, GameObj, StateComp } from "kaplay";
import { TogglerComp } from "./toggler";
import { player } from "../player";
import { LinkComp } from "./linked";
import { K } from "../init";

export interface InvisibleTriggerComp extends Comp {
    setup(s: string): void
    and: GameObj<StateComp | TogglerComp> | undefined
    andState: string
    triggered: boolean
    resettable: boolean
    _maybeToggle(): void
}

export function invisibleTriggerComp(): InvisibleTriggerComp {
    return {
        id: "invisible-trigger",
        require: ["linked", "toggler", "area"],
        and: undefined, // if set this must be on for trigger to happen
        andState: "on",
        triggered: false,
        resettable: false,
        add(this: GameObj) {
            this.use("raycastIgnore");
        },
        setup(this: GameObj<AreaComp | TogglerComp | InvisibleTriggerComp>, s) {
            // format is "1" if oneshot 
            // + "p" if event target is player
            // + events that trigger changes
            const ss = s.split(/\s+/g);
            this.resettable = ss[0] !== "1"
            const target = ss[1] === "p" ? player : this;
            ss.slice(2).forEach(event => {
                const v = event.split("|") as any[];
                const name = v[0];
                const args = v.slice(1).concat(() => this._maybeToggle());
                (target as any)[name!](...args);
            })
        },
        _maybeToggle(this: GameObj<InvisibleTriggerComp | LinkComp | TogglerComp>) {
            if (this.and && this.and.state !== this.andState) return;
            if (this.triggered && !this.resettable) return;
            this.triggered = true;
            this.broadcast(this.toggleMsg);
        },
        inspect() {
            return "triggered: " + this.triggered;
        }
    }
}
