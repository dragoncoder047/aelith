import kaplay from "kaplay";
import { SCALE } from "./constants";
import { CONTROLS } from "./controls/buttons";
import { kaplayAABB } from "./plugins/kaplay-aabb";
import { kaplayControlGroup } from "./plugins/kaplay-control-group";
import { kaplayDynamicStrings } from "./plugins/kaplay-dynamic-text";
import { kaplayRumble } from "./plugins/kaplay-gamepad-rumble";
import { kaplayPTY } from "./plugins/kaplay-pty";
import { kaplaySprings } from "./plugins/kaplay-springs";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";
import { kaplayZzFXM } from "./plugins/kaplay-zzfxm";
import kaplayLighting from "kaplay-lighting";

export const K = kaplay({
    debug: true,
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS,
    touchToMouse: false,
    inspectOnlyActive: true,
    tagComponentIds: false,
    font: "Unscii",
    plugins: [
        kaplayZzFX,
        kaplayZzFXM,
        kaplaySprings,
        kaplayDynamicStrings,
        kaplayPTY,
        kaplayRumble,
        kaplayControlGroup,
        kaplayAABB,
        kaplayLighting
    ],
});

K.onLoadError((which, e) => {
    throw `Error while loading ${which}: ${e.error}${e.error?.stack ? `\n\nBacktrace:\n${e.error.stack}` : ""}`;
});
