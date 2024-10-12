import { Comp, GameObj, TextComp } from "kaplay";
import { K } from "../init";

export interface DynamicTextComp extends Comp {
    textFunc: (() => string) | undefined
}

export function dynamicText(): DynamicTextComp {
    return {
        id: "dynamic-text",
        require: ["text"],
        textFunc: undefined,
        update(this: GameObj<TextComp | DynamicTextComp>) {
            if (this.textFunc) {
                this.text = this.textFunc();
            }
        },
    }
}