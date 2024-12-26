import kaplay from "kaplay";
import { SCALE } from "./constants";
import { CONTROLS } from "./controls/buttons";
import { kaplayDynamicStrings } from "./plugins/kaplay-dynamic-text";
import { kaplayPTY } from "./plugins/kaplay-pty";
import { kaplaySprings } from "./plugins/kaplay-springs";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";
import { kaplayZzFXM } from "./plugins/kaplay-zzfxm";
import { kaplayRumble } from "./plugins/kaplay-gamepad-rumble";

export const K = kaplay({
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS,
    font: "IBM Mono",
    plugins: [
        kaplayZzFX,
        kaplayZzFXM,
        kaplaySprings,
        kaplayDynamicStrings,
        kaplayPTY,
        kaplayRumble
    ],
});

// @ts-expect-error
window.K = K;

// const oldOnUpdate = K.onUpdate;

K.onLoadError((which, e) => {
    throw `Error while loading ${which}: ${e.error?.stack ?? e.error}`;
});
