import { K } from "./context";
import * as GamepadDetect from "./GamepadDetect";

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

export function setupDetection() {
    K.app.onGamepadConnect(g => {
        const id = navigator.getGamepads()[g.index]!.id;
        gamepadType = GamepadDetect.detectGamepadTypeFromID(id);
    });
}
