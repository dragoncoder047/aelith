import { KGamepadButton, TextComp } from "kaplay";
import { K } from "../init";
import trapTypes from "./trapTypes.yaml";
import { STICK_DEADZONE, TILE_SIZE } from "../constants";

export const STYLES: TextComp["textStyles"] = {
    cursor(_, __) {
        return {
            color: K.GREEN,
            opacity: Math.round(K.wave(0, 1, K.time() * 3 * Math.PI)),
        };
    },
    gamename: {
        color: K.rgb("#aa22ff"),
        font: "Unscii MCR"
    },
    selected: {
        color: K.MAGENTA,
    },
    command: {
        color: K.YELLOW,
    },
    prompt: {
        color: K.CYAN,
    },
    ident: {
        color: K.GREEN,
    },
    stderr: {
        color: K.RED.lighten(100),
    },
    // XXX: these 4 are not used
    red: {
        color: K.RED,
    },
    green: {
        color: K.GREEN,
    },
    yellow: {
        color: K.YELLOW,
    },
    blue: {
        color: K.BLUE,
    },
    b: {
        color: K.WHITE,
        override: true
    },
    sm: {
        scale: K.vec2(1, .75),
        pos: K.vec2(0, 2),
    },
    key(_, ch) {
        const which = { w: "up", a: "left", s: "down", d: "right" }[ch] ?? ch.toLowerCase();
        return {
            font: "keyfont",
            scale: 4,
            stretchInPlace: true,
            color: K.isKeyDown(which) ? K.YELLOW : K.WHITE
        }
    },
    key2(_, ch) {
        const which = { t: "tab", n: "enter", "^": "shift", e: "escape", b: "backspace" }[ch]!;
        return {
            font: "keyfont2",
            scale: 4,
            stretchInPlace: true,
            color: K.isKeyDown(which) ? K.YELLOW : K.WHITE
        }
    },
    key3(_, ch) {
        const which = { s: "space" }[ch]!;
        return {
            font: "keyfont3",
            scale: 4,
            stretchInPlace: true,
            color: K.isKeyDown(which) ? K.YELLOW : K.WHITE
        }
    },
    mouse(_, ch) {
        const c = ch === "m" ? K.isMouseMoved() : ch === "s" ? false : K.isMouseDown(ch === "l" ? "left" : "right");
        return {
            font: "mousefont",
            scale: 4,
            stretchInPlace: true,
            color: c ? K.YELLOW : K.WHITE
        }
    },
    inverted: {
        shader: "invert",
        uniform: { u_bg_color: K.WHITE }
    },
    rainbow(i, _ch) {
        return {
            color: K.Color.fromHSL((K.time() - i / 20) % 1, 1, 2 / 3),
            override: true
        };
    },
    bouncy(i, _ch) {
        return {
            pos: K.vec2(0, K.wave(-TILE_SIZE / 40, TILE_SIZE / 40, K.time() * Math.PI * 2 - i)),
        };
    },
    blink(_, __) {
        return {
            opacity: K.wave(0, 1, K.time() * 3 * Math.PI) > 0.3 ? 1 : 0,
        };
    },
};

// add all the continuation colors
for (var name of Object.getOwnPropertyNames(trapTypes) as string[]) {
    STYLES[name.replace(/[^\w]/g, "")] = {
        color: K.rgb((trapTypes as any)[name].color).lighten(100),
        override: true
    };
}

for (var f of ["xbox", "switch", "ps4", "ps5"]) {
    const n = "font_" + f;
    STYLES[n] = (_, ch) => {
        return {
            font: n,
            scale: 4,
            stretchInPlace: true,
            color: checkControllerButton(ch) ? K.YELLOW : K.WHITE,
        }
    };
}

function checkControllerButton(ch: string) {
    const res = {
        d: ["dpad-up", "dpad-down", "dpad-left", "dpad-right"],
        1: "dpad-left",
        2: "dpad-up",
        3: "dpad-right",
        4: "dpad-down",
        v: ["dpad-up", "dpad-down"],
        N: "north",
        E: "east",
        W: "west",
        S: "south",
        l: "lshoulder",
        r: "rshoulder",
        L: "ltrigger",
        R: "rtrigger",
        e: "select",
        t: "start",
        j: "lstick",
        k: "rstick"
    }[ch] as KGamepadButton | KGamepadButton[] | undefined;
    if (res) return Array.isArray(res) ? res.some(v => K.isGamepadButtonDown(v)) : K.isGamepadButtonDown(res);
    const res2 = {
        J: [["left", "x"], ["left", "y"]],
        K: [["right", "x"], ["right", "y"]],
        X: [["left", "x"]],
        x: [["right", "x"]],
        Y: [["left", "y"]],
        y: [["left", "y"]],
    }[ch] as ["left" | "right", "x" | "y"][] | undefined;
    if (res2) return res2.some(([s, a]) => Math.abs(K.getGamepadStick(s)[a]) > STICK_DEADZONE);
    return false;
}
