import { TextComp } from "kaplay";
import { K } from "../init";

export const styles: TextComp["textStyles"] = {
    cursor(_i, _ch) {
        return {
            opacity: Math.round(K.wave(0, 1, K.time() * 2 * Math.PI)),
            color: K.GREEN,
        }
    },
    command(_i, _ch) {
        return {
            color: K.YELLOW,
        }
    },
    prompt(_i, _ch) {
        return {
            color: K.CYAN,
        }
    },
    ident(_i, _ch) {
        return {
            color: K.GREEN,
        }
    },
    gamename(_i, _ch) {
        return {
            color: K.MAGENTA,
        }
    }
};