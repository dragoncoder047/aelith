import { TextComp } from "kaplay";
import { K } from "../init";
import trapTypes from "./trapTypes.yaml" with { type: "json" };
import { TILE_SIZE } from "../constants";

export const STYLES: TextComp["textStyles"] = {
    cursor(_, __) {
        return {
            color: K.GREEN,
            opacity: Math.round(K.wave(0, 1, K.time() * 3 * Math.PI)),
        };
    },
    gamename: {
        color: K.rgb("#aa22ff"),
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
for (var name of Object.getOwnPropertyNames(trapTypes) as (keyof typeof trapTypes)[]) {
    STYLES[name.replace(/[^\w]/g, "")] = { color: K.rgb(trapTypes[name].color), override: true };
}
