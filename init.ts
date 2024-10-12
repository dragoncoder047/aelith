import kaplay, { KAPLAYCtx, MergePlugins } from "kaplay";
import { SCALE } from "./constants";
import { CONTROLS } from "./player/controls/buttons";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";

// why is the MergePlugins necessary?
export const K: KAPLAYCtx<typeof CONTROLS> & MergePlugins<[typeof kaplayZzFX]> = kaplay({
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS,
    plugins: [kaplayZzFX],
});

// @ts-expect-error
window.K = K;

export function nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
