import { Comp } from "kaplay";
import { MParser } from "../assets/mparser";
import { invisibleTriggerComp } from "../components/invisibleTrigger";
import { linked } from "../components/linked";
import { toggler } from "../components/toggler";
import { K } from "../init";
import { textNote } from "./text";

export function popupTextNote() {
    return [
        ...textNote(),
        toggler("off", "on", false),
        K.state("off"),
        K.area(),
        linked(MParser.uid()),
        invisibleTriggerComp(),
        { // TODO: remove this kludge component
            update() {
                // @ts-ignore
                this.opacity = +(this.state === "on");
            }
        } as Comp
    ]
}
