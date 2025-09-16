import { GameObj, PosComp, SpriteComp, StateComp, Tag } from "kaplay";
import { spriteToggle } from "../components/spriteToggle";
import { K } from "../init";
import { machine } from "./machine";
import { interactable } from "../components/interactable";
import { player } from "../player";
import { splash } from "../misc/particles";
import { lightComp, LightHelperComp } from "../components/light_helpers";
import { TILE_SIZE } from "../constants";

export function light() {
    return [
        K.sprite("light"),
        spriteToggle(),
        ...machine(),
        K.anchor("bot"),
        "light" as Tag,
        interactable(),
        lightComp(K.vec2(0, -TILE_SIZE / 4)),
        {
            update(this: GameObj<LightHelperComp | SpriteComp>) {
                this.light!.color = this.frame === 1 ? K.GREEN : K.RED;
            },
            target1(this: GameObj<PosComp | StateComp<"off" | "on">>) {
                player.playSound("tink", {}, this.pos);
                splash(this.pos, this.state === "off" ? K.RED : K.GREEN, 2);
                return true;
            },
            target1Hint: "&msg.ctlHint.item.light.smack"
        }
    ]
}
