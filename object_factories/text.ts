import { CompList } from "kaplay";
import { K } from "../init";
import { SCALE, TILE_SIZE } from "../constants";
import { dynamicText } from "../components/dynamicText";
import { styles } from "../assets/textStyles";

export function textNote(): CompList<any> {
    return [
        K.text("(null)", {
            font: "IBM Mono",
            size: 16 / SCALE,
            width: TILE_SIZE * 4,
            align: "left",
            lineSpacing: 1.15,
            styles,
        }),
        K.color(K.WHITE.darken(100)),
        K.timer(),
        dynamicText(),
    ]
}
