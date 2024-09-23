import { AreaComp, GameObj, OutlineComp } from 'kaplay';
import K from '../init';
import { player } from '../main';

/**
 * Makes the object show a white outline on hover.
 *
 * TODO: this doesn't work (kaplayjs/kaplay#394)
 * @param {number} [blinkFreq=1.5]
 */
export function hoverOutline(blinkFreq: number = 1.5) {
    return {
        id: "hoverOutline",
        require: ["area", "outline"],
        update(this: GameObj<AreaComp | OutlineComp>) {
            if (this.isHovering() && player.canTouch(this)) {
                this.outline.width = K.wave(0, 2, K.time() * Math.PI * blinkFreq);
            }
            else {
                this.outline.width = 0;
            }
        },
    };
}
