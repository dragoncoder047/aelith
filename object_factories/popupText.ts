import { Comp, Tag } from "kaplay";
import { MParser } from "../levels/mparser";
import { invisibleTriggerComp } from "../components/invisibleTrigger";
import { linked } from "../components/linked";
import { toggler } from "../components/toggler";
import { K } from "../init";
import { textNote } from "./text";
import { StateManager } from "../save_state";

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
        } as Comp,
        "raycastIgnore" as Tag,
        "saveable" as Tag,
        { reviver: "popupText" }
    ]
}

StateManager.registerReviver("popupText", popupTextNote);
