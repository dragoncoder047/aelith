import { CONTROLS } from "./player/controls";
import { SCALE } from "./constants";
import kaplay from "kaplay";
import { KAPLAYCtx } from "kaplay";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";

export const K: KAPLAYCtx<typeof CONTROLS> = kaplay({
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS,
    plugins: [kaplayZzFX],
});

// @ts-expect-error
window.K = K;
