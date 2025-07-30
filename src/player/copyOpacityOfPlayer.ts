import { Comp, GameObj, OpacityComp, PosComp } from "kaplay";
import { player } from ".";
import { SpringComp } from "../plugins/kaplay-springs";

export interface CopyOpacityOfPlayerComp extends Comp { }

export function copyOpacityOfPlayer(): CopyOpacityOfPlayerComp {
    return {
        id: "copy-oop",
        require: ["opacity"],
        draw(this: GameObj<OpacityComp | SpringComp | PosComp>) {
            this.hidden = player.hidden || player.opacity === 0;
            this.opacity = player.opacity;
            if (this.has("spring"))
                this.drawOpts.opacity = player.opacity;
        },
        update(this: GameObj) {
            this.hidden = player.hidden || player.opacity === 0;
        }
    }
}
