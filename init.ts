import kaplay from "kaplay";
import { SCALE } from "./constants";
import { CONTROLS } from "./player/controls/buttons";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";
import { kaplaySprings } from "./plugins/kaplay-springs";

export const K = kaplay({
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS,
    plugins: [kaplayZzFX, kaplaySprings],
});

// @ts-expect-error
window.K = K;

export function nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
