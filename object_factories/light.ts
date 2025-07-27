import { GameObj, PosComp, StateComp, Tag } from "kaplay";
import { spriteToggle } from "../components/spriteToggle";
import { K } from "../init";
import { machine } from "./machine";
import { interactable } from "../components/interactable";
import { player } from "../player";
import { splash } from "../misc/particles";

export function light() {
    return [
        K.sprite("light"),
        spriteToggle(),
        ...machine(),
        K.anchor("bot"),
        "light" as Tag,
        interactable(),
        {
            target1(this: GameObj<PosComp | StateComp<"off" | "on">>) {
                player.playSound("tink", {}, this.pos);
                splash(this.pos, this.state === "off" ? K.RED : K.GREEN, 2);
                return true;
            },
            target1Hint: "&msg.ctlHint.item.light.smack"
        }
    ]
}
