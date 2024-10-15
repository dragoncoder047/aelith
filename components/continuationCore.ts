import { Comp, GameObj } from "kaplay";
import contTypes from "../assets/trapTypes.json";
import { ContinuationData } from "./continuationTrap";
import { K } from "../init";

export interface ContinuationComp extends Comp {
    type: keyof typeof contTypes
    readonly data: (typeof contTypes)[keyof typeof contTypes] | undefined

    captured: ContinuationData
    invoke(): void,
}

export function continuationCore(
    type: keyof typeof contTypes,
    captured: ContinuationData
): ContinuationComp {
    return {
        id: "continuation",
        require: ["sprite", "pos"],
        type,
        captured,
        get data() {
            return contTypes[this.type];
        },
        add(this: GameObj<ContinuationComp>) {
            this.on("invoke", () => this.invoke());
        },
        invoke(this: GameObj<ContinuationComp>) {
            K.debug.log("restore", this.type);
            // do restore of captured data
            if (!this.data!.reusable) this.destroy();
        },
    };
}