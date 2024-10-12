import { CompList } from "kaplay";
import { K } from "../init";
import { SCALE, TILE_SIZE } from "../constants";

export function textNote(): CompList<any> {
    return [
        K.text("(null)", {
            font: "IBM Mono",
            size: 16 / SCALE,
            width: TILE_SIZE * 4,
            align: "left"
        }),
        K.color(K.WHITE.darken(100)),
    ]
}
