import kaplay from "kaplay";
import { SCALE } from "./constants";
import { CONTROLS } from "./player/controls/buttons";
import { kaplayDynamicStrings } from "./plugins/kaplay-dynamic-text";
import { kaplaySprings } from "./plugins/kaplay-springs";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";
import { kaplayZzFXM } from "./plugins/kaplay-zzfxm";

export const K = kaplay({
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS,
    plugins: [kaplayZzFX, kaplayZzFXM, kaplaySprings, kaplayDynamicStrings],
});

// @ts-expect-error
window.K = K;
