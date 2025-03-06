import { STYLES } from "../assets/textStyles";
import { FONT_SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";

export function textNote() {
    return [
        K.text("", {
            size: 16 / FONT_SCALE,
            width: TILE_SIZE * 4,
            align: "left",
            lineSpacing: 1.15,
            styles: STYLES,
        }),
        K.opacity(1),
        K.color(K.WHITE.darken(100)),
        K.timer(),
        K.layer("text"),
        K.dynamicText(),
    ]
}
