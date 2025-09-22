import { TextComp } from "kaplay";
import { K } from "./context";

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
    // TODO: uncomment when kaplayjs/kaplay#895 is merged
    // i: {
    //     skew: 20,
    // },
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

// generate xterm256 color palette
var x;
for (x = 0; x < 8; x++) {
    STYLES["xt" + x] = {
        color: K.rgb(x & 1 ? 0xAA : 0, x & 2 ? 0xAA : 0, x & 4 ? 0xAA : 0),
    }
}

for (x = 8; x < 16; x++) {
    STYLES["xt" + x] = {
        color: K.rgb(x & 1 ? 0xFF : 0x55, x & 2 ? 0xFF : 0x55, x & 4 ? 0xFF : 0x55),
    }
}
var cubeLevels = [0x00, 0x66, 0x88, 0xBB, 0xDD, 0xFF];
for (x = 16; x < 232; x++) {
    var bx = (x - 16) % 6;
    var gx = (((x - 16) / 6) | 0) % 6;
    var rx = (((x - 16) / 36) | 0) % 6;
    STYLES["xt" + x] = {
        color: K.rgb(cubeLevels[rx]!, cubeLevels[gx]!, cubeLevels[bx]!)
    }
}
for (var r = 0; r < 6; r++) {
    for (var g = 0; g < 6; g++) {
        for (var b = 0; b < 6; b++) {
            var rr = cubeLevels[r]!;
            var gg = cubeLevels[g]!;
            var bb = cubeLevels[b]!;
            STYLES["xt" + (x++)] = {
                color: K.rgb(rr, gg, bb),
            };
        }
    }
}
for (x = 232; x < 256; x++) {
    var gray = 8 + (x - 232) * 10;
    STYLES["xt" + x] = {
        color: K.rgb(gray, gray, gray),
    };
}
