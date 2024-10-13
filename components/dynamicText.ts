import { Comp, GameObj, TextComp } from "kaplay";
import { processTextReplacements } from "../utils";
import controlStrings from "../player/controls/strings.json";
import { K } from "../init";

export interface DynamicTextComp extends Comp {
    t: string
}

export function dynamicText(): DynamicTextComp {
    return {
        id: "dynamic-text",
        require: ["text"],
        t: "",
        update(this: GameObj<TextComp | DynamicTextComp>) {
            const cStrings = K.getLastInputDeviceType() === "gamepad" ? controlStrings.gamepad : controlStrings.keyboard;
            this.text = processTextReplacements(this.t, cStrings);
        },
    }
}