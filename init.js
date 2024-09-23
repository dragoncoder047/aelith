import { CONTROLS } from './controls.js';
import { SCALE } from './constants.js';

/**
 * @type {import("kaplay").KAPLAYCtx}
 */
export const K = kaplay({
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS
});
export default K;
// cSpell: ignore kaplay


