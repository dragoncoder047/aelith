import kaplay from "kaplay";
import { SCALE } from "./constants";
import { CONTROLS } from "./player/controls/buttons";
import { kaplayDynamicStrings } from "./plugins/kaplay-dynamic-strings";
import { kaplaySprings } from "./plugins/kaplay-springs";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";

export const K = kaplay({
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS,
    plugins: [kaplayZzFX, kaplaySprings, kaplayDynamicStrings],
});

// @ts-expect-error
window.K = K;
