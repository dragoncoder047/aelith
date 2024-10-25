import { K } from "../init";
import { FONT_SCALE, TILE_SIZE } from "../constants";
import { styles } from "../assets/textStyles";

export function textNote() {
    return [
        K.text("", {
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
        K.dynamicText(),
    ]
}
