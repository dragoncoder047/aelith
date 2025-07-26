import { GameObj } from "kaplay";
import { K } from "../init";
import { player } from "../player";
import { InteractableComp } from "./interactable";

export function grabbable(hint: string) {
    return {
        id: "grabbable",
        require: ["interactable"],
        target1(this: GameObj<InteractableComp>) {
            player.grab(this as any);
            return true;
        },
        target1Hint: hint
    }
}
