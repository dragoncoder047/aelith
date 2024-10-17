import { TextComp } from "kaplay";
import { K } from "../init";
import trapTypes from "./trapTypes.json";
import { TILE_SIZE } from "../constants";

export const styles: TextComp["textStyles"] = {
    cursor(_i, _ch) {
        return {
            opacity: Math.round(K.wave(0, 1, K.time() * 2 * Math.PI)),
            color: K.GREEN,
        }
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
    gamename: {
        color: K.Color.fromHex(trapTypes["call/cc"].color),
    },
    green: {
        color: K.Color.fromHex(trapTypes.assert.color),
    },
    blue: {
        color: K.Color.fromHex(trapTypes.throw.color),
    },
    special(i, _ch) {
        return {
            color: K.Color.fromHSL((K.time() - i / 20) % 1, 1, 2 / 3),
            pos: K.vec2(0, K.wave(-TILE_SIZE / 40, TILE_SIZE / 40, K.time() * Math.PI * 2 - i)),
        };
    }
};