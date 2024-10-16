import { Comp, GameObj, TextComp } from "kaplay";
import { processTextReplacements } from "../utils";
import strings from "../assets/strings.json";
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
            this.text = processTextReplacements(this.t, {
                ...strings,
                inputType:
                    K.getLastInputDeviceType() === "gamepad"
                        ? "gamepad"
                        : "keyboard"
            });
        },
        inspect() {
            return "sub: " + this.t;
        }
    }
}