import { TextComp } from "kaplay";
import { K } from "../init";

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
    gamename: {
        color: K.MAGENTA,
    },
    stderr: {
        color: K.RED.lighten(100),
    }
};