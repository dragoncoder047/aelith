import kaplay from "kaplay";
import kaplayLighting from "kaplay-lighting";
import { SCALE } from "../static/constants";
import { kaplayDynamicStrings } from "./plugins/kaplay-dynamic-text";
import { kaplayExtraDistance } from "./plugins/kaplay-extradistance";
import { kaplayRumble } from "./plugins/kaplay-gamepad-rumble";
import { kaplayHoverArea } from "./plugins/kaplay-hover-area";
import { kaplayNormalMapGen } from "./plugins/kaplay-normal-map";
import { kaplayXterm256 } from "./plugins/kaplay-xterm256";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";

export const K = kaplay({
    debug: true,
    crisp: true,
    global: false,
    pixelDensity: Math.min(window.devicePixelRatio, 2),
    scale: SCALE,
    background: "#000000",
    touchToMouse: false,
    inspectOnlyActive: true,
    tagComponentIds: false,
    plugins: [
        kaplayXterm256,
        kaplayZzFX,
        // kaplayZzFXM,
        kaplayExtraDistance,
        kaplayDynamicStrings,
        kaplayRumble,
        kaplayLighting,
        kaplayHoverArea,
        kaplayNormalMapGen,
    ],
});

K.onLoadError((which, e) => {
    const newError = new Error(`Error while loading ${which}: ${e.error?.message ?? e.error}`);
    if (e.error?.stack) newError.stack = e.error.stack;
    throw newError;
});
