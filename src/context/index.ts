import kaplay from "kaplay";
import kaplayLighting from "kaplay-lighting";
import { SCALE } from "../static/constants";
import { kaplayAABB } from "./plugins/kaplay-aabb";
import { kaplayDynamicStrings } from "./plugins/kaplay-dynamic-text";
import { kaplayExtraDistance } from "./plugins/kaplay-extradistance";
import { kaplayRumble } from "./plugins/kaplay-gamepad-rumble";
import { kaplayHoverArea } from "./plugins/kaplay-hover-area";
import { kaplayXterm256 } from "./plugins/kaplay-xterm256";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";
import { kaplayZzFXM } from "./plugins/kaplay-zzfxm";

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
        kaplayZzFXM,
        kaplayExtraDistance,
        kaplayDynamicStrings,
        kaplayRumble,
        kaplayAABB,
        kaplayLighting,
        kaplayHoverArea
    ],
});

K.onLoadError((which, e) => {
    const newError = new Error(`Error while loading ${which}: ${e.error?.message ?? e.error}`);
    if (e.error?.stack) newError.stack = e.error.stack;
    throw newError;
});
