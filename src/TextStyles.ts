import { TextComp } from "kaplay";
import { K } from "./context";

export const DEF_TEXT_SIZE = 8;
export const DEF_STYLES = {
    color: K.WHITE.darken(50),
};

export const STYLES: TextComp["textStyles"] = {
    cursor(_, __) {
        return {
            color: K.GREEN,
            opacity: Math.round(K.wave(0, 1, K.time() * 3 * Math.PI)),
        };
    },
    // gamename: {
    //     color: K.rgb("#aa22ff"),
    //     font: "Unscii MCR"
    // },
    // selected: {
    //     color: K.MAGENTA,
    // },
    // command: {
    //     color: K.YELLOW,
    // },
    // prompt: {
    //     color: K.CYAN,
    // },
    // ident: {
    //     color: K.GREEN,
    // },
    // stderr: {
    //     color: K.RED.lighten(100),
    // },
    b: {
        color: K.WHITE,
        override: true
    },
    i: {
        skew: 20,
    },
    sm: {
        scale: 0.6
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
        color: K.YELLOW,
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
    blink() {
        return {
            opacity: K.wave(0, 1, K.time() * 3 * Math.PI) > 0.3 ? 1 : 0,
        };
    },
    color(_i, _ch, arg) {
        return {
            color: K.rgb(arg),
        }
    }
};

for (var f of ["xbox", "switch", "ps4", "ps5"]) {
    const n = "font_" + f;
    STYLES[n] = {
        font: n,
        scale: 4,
        stretchInPlace: true,
    };
}
