import { CONTROLS } from './controls';
import { SCALE } from './constants';
import kaplay from 'kaplay';
import { type KAPLAYCtx } from 'kaplay';

export const K: KAPLAYCtx = kaplay({
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS
});
export default K;
