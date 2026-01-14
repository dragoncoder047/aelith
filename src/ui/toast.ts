import { Color, GameObj } from "kaplay";
import { K } from "../context";
import * as GameManager from "../GameManager";
import { DEF_STYLES, DEF_TEXT_SIZE, STYLES } from "../TextStyles";

var curToast: GameObj | null = null;

const PAD = 5;
const OFFSET = PAD * 3;
const BORDER_WIDTH = 3;

export function toast(color: Color, text: string) {
    if (curToast) {
        curToast.toastColor = color;
        curToast.t = text;
        curToast.timer = 0;
    } else {
        curToast = K.add([
            K.pos(OFFSET, OFFSET),
            K.layer(K._k.game.layers!.at(-1)!),
            {
                toastColor: color,
                timer: 0,
                add(this: GameObj) {
                    K.tween(0, 1, .2, progress => {
                        this.moveTo(K.lerp(-this.width - PAD - BORDER_WIDTH, OFFSET + BORDER_WIDTH, K.easings.easeOutBack(progress)), OFFSET);
                    });
                },
                update(this: GameObj) {
                    this.timer += K.dt();
                    if (this.timer > 5 && this === curToast) {
                        curToast = null;
                        K.tween(1, 0, .2, progress => {
                            this.moveTo(K.lerp(-this.width - PAD - BORDER_WIDTH, OFFSET + BORDER_WIDTH, progress), OFFSET);
                        }).then(() => {
                            this.destroy();
                        });
                    }
                },
                draw(this: GameObj) {
                    K.drawRect({
                        pos: K.vec2(-PAD, -PAD),
                        width: this.width + PAD * 2,
                        height: this.height + PAD * 2,
                        color: K.BLACK,
                        outline: {
                            color: this.toastColor,
                            width: BORDER_WIDTH,
                        }
                    });
                }
            },
            K.text("", {
                styles: STYLES,
                transform: DEF_STYLES,
                size: DEF_TEXT_SIZE * 2,
                align: "center",
                font: GameManager.getDefaultValue("font"),
            }),
            K.dynamicText(text),
        ])
    }
}
