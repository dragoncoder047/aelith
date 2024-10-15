import { CompList } from "kaplay";
import { K } from "../init";
import { FONT_SCALE, TILE_SIZE } from "../constants";
import { dynamicText } from "../components/dynamicText";
import { styles } from "../assets/textStyles";

export function textNote(): CompList<any> {
    return [
        K.text("(null)", {
            font: "IBM Mono",
            size: 16 / FONT_SCALE,
            width: TILE_SIZE * 4,
            align: "left",
            lineSpacing: 1.15,
            styles,
        }),
        K.color(K.WHITE.darken(100)),
        K.opacity(1),
        K.timer(),
        K.layer("text"),
        dynamicText(),
    ]
}
