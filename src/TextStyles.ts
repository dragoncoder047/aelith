import { TextComp } from "kaplay";
import { K } from "./context";

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
    keyfont_1: {
        font: "keyfont_1",
        scale: 4,
        stretchInPlace: true,
    },
    keyfont_2: {
        font: "keyfont_2",
        scale: 4,
        stretchInPlace: true,
    },
    keyfont_3: {
        font: "keyfont_3",
        scale: 4,
        stretchInPlace: true,
    },
    mousefont: {
        font: "mousefont",
        scale: 4,
        stretchInPlace: true,
    },
    pressed: {
        color: K.YELLOW
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
            pos: K.vec2(0, K.wave(-2, 2, K.time() * Math.PI * 2 - i)),
        };
    },
    blink(_, __) {
        return {
            opacity: K.wave(0, 1, K.time() * 3 * Math.PI) > 0.3 ? 1 : 0,
        };
    },
};

for (var f of ["xbox", "switch", "ps4", "ps5"]) {
    const n = "font_" + f;
    STYLES[n] = {
        font: n,
        scale: 4,
        stretchInPlace: true,
    };
}
