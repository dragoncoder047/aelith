import K from '../init.js';
import { player } from '../main.js';

/**
 * Makes the object show a white outline on hover.
 *
 * TODO: this doesn't work (kaplayjs/kaplay#394)
 * @param {number} [blinkFreq=1.5]
 */
export function hoverOutline(blinkFreq = 1.5) {
    return {
        id: "hoverOutline",
        require: ["area", "outline"],
        /**
         * @this {import("kaplay").GameObj<import("kaplay").AreaComp | import("kaplay").OutlineComp>}
         */
        update() {
            if (this.isHovering() && player.canTouch(this)) {
                this.outline.width = K.wave(0, 2, K.time() * Math.PI * blinkFreq);
            }
            else {
                this.outline.width = 0;
            }
        },
    };
}
