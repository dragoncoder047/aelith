import { K } from "./context";
import * as GamepadDetect from "./GamepadDetect";

var gamepadType: string | undefined = undefined;
export function currentGamepadType() {
    return gamepadType;
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
    const a = getUserAgentString().toLowerCase();
    return a.includes("mac") ? "mac" : a.includes("win") ? "windows" : "linux";
}

export function setupDetection() {
    K.onGamepadConnect(g => {
        const id = navigator.getGamepads()[g.index]!.id;
        gamepadType = GamepadDetect.detectGamepadTypeFromID(id);
    });
}
