import { Comp, GameObj, TextComp } from "kaplay";
import { processTextReplacements } from "../utils";

export interface DynamicTextComp extends Comp {
    textFunc: (() => string) | undefined,
    baseText: string | undefined
}

export function dynamicText(): DynamicTextComp {
    return {
        id: "dynamic-text",
        require: ["text"],
        textFunc: undefined,
        baseText: undefined,
        update(this: GameObj<TextComp | DynamicTextComp>) {
            if (this.textFunc) {
                if (this.baseText) this.text = processTextReplacements(this.baseText, { s: this.textFunc() });
                else this.text = this.textFunc();
            }
        },
    }
}