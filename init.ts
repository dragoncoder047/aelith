import kaplay from "kaplay";
import { SCALE } from "./constants";
import { CONTROLS } from "./controls/buttons";
import { kaplayCachePhysics } from "./plugins/kaplay-cached-physics";
import { kaplayControlGroup } from "./plugins/kaplay-control-group";
import { kaplayDynamicStrings } from "./plugins/kaplay-dynamic-text";
import { kaplayRumble } from "./plugins/kaplay-gamepad-rumble";
import { kaplayPTY } from "./plugins/kaplay-pty";
import { kaplaySprings } from "./plugins/kaplay-springs";
import { kaplaySpriteRestart } from "./plugins/kaplay-sprite-play-restart";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";
import { kaplayZzFXM } from "./plugins/kaplay-zzfxm";

export const K = kaplay({
    debug: true,
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS,
    touchToMouse: false,
    inspectOnlyActive: true,
    font: "IBM Mono",
    plugins: [
        kaplayZzFX,
        kaplayZzFXM,
        kaplaySprings,
        kaplayDynamicStrings,
        kaplayPTY,
        kaplayRumble,
        kaplayControlGroup,
        kaplayCachePhysics,
        kaplaySpriteRestart,
    ],
});

K.onLoadError((which, e) => {
    throw `Error while loading ${which}: ${e.error}${e.error?.stack ? `\n\nBacktrace:\n${e.error.stack}` : ""}`;
});
