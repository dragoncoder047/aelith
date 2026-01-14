import { K } from "./context";
import * as GamepadDetect from "./GamepadDetect";
import { MenuItemType } from "./scenes/menus/types";
import { mmo } from "./static/systemMenus";
import { toast } from "./ui/toast";

var gamepadType: string | undefined = undefined;
export function currentGamepadType() {
    return gamepadType;
}

export function changeGamepadType(type: string) {
    gamepadType = type;
}

function getUserAgentString() {
    // @ts-ignore
    return navigator.userAgent || navigator.vendor || window.opera;
}

export function isFirefox() {
    // @ts-ignore
    return typeof window.mozInnerScreenX !== "undefined";
}

export function guessOS() {
    const a = getUserAgentString();
    return /mac|apple/i.test(a) ? "mac" : /win/i.test(a) ? "windows" : "linux";
}

var idLog: [string, string][] = [];
export function setupDetection() {
    K.app.onGamepadConnect(g => {
        const id = navigator.getGamepads()[g.index]!.id;
        gamepadType = GamepadDetect.detectGamepadTypeFromID(id);
        idLog.push([id, gamepadType ?? "unknown"]);
    });
}

export function getDebugInfo() {
    const out: [string, any][] = [
        ["K.VERSION", K.VERSION],
        ["framecount", K.debug.numFrames()],
        ["User-Agent", getUserAgentString()],
        ["OS", guessOS()],
        ["Firefox", isFirefox()],
    ];
    for (var i = 0; i < idLog.length; i++) {
        const [id, type] = idLog[i]!;
        out.push([`gamepads\\[${i}].id`, id]);
        out.push([`gamepads\\[${i}].type`, type]);
    }
    const gl = K._k.gfx.ggl.gl;

    out.push(["gl.RENDERER", gl.getParameter(gl.RENDERER)]);

    const debugRendererInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugRendererInfo) {
        out.push(["UNMASKED_VENDOR", gl.getParameter(debugRendererInfo.UNMASKED_VENDOR_WEBGL)]);
        out.push(["UNMASKED_RENDERER", gl.getParameter(debugRendererInfo.UNMASKED_RENDERER_WEBGL)]);
    }

    const lagFrames = performance.getEntriesByType("long-animation-frame").map(fr => fr.duration);

    out.push(["numLagFrames", lagFrames.length]);
    out.push(["lagginess", lagFrames.length / K.debug.numFrames()]);
    out.push(["meanLagTime", lagFrames.reduce((a, b) => a + b, 0) / lagFrames.length]);
    return out;
}
