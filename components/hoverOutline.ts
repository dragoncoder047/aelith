import { AreaComp, Comp, GameObj, OutlineComp, PosComp } from 'kaplay';
import { K } from "../init";
import { player } from '../player';

export interface HoverOutlineComp extends Comp {
}

/**
 * Makes the object show a white outline on hover.
 *
 * TODO: this doesn't work (kaplayjs/kaplay#394)
 * @param {number} [blinkFreq=1.5]
 */
export function hoverOutline(blinkFreq: number = 1.5): HoverOutlineComp {
    return {
        id: "hoverOutline",
        require: ["area", "outline"],
        update(this: GameObj<AreaComp | OutlineComp | PosComp>) {
            if (this.isHovering() && player.canTouch(this)) {
                this.outline.width = K.wave(0, 2, K.time() * Math.PI * blinkFreq);
            }
            else {
                this.outline.width = 0;
            }
        },
    };
}
