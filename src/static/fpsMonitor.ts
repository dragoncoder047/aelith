import { K } from "../context";
import * as GameManager from "../GameManager";
import { BooleanSetting } from "../settings";
import { SYSTEM_SETTINGS } from "./systemMenus";

const data = new Array(100).fill(0);
var index = 0;
var sum = 0;
export function install() {
    K.add([
        K.layer(K._k.game.layers!.at(-1)!),
        K.fixed(),
        {
            add() {
                K.loop(1 / 64, () => {
                    sum -= data[index];
                    sum += (data[index++] = K.dt());
                    if (index >= data.length) index = 0;
                });
            },
            draw() {
                if (!SYSTEM_SETTINGS.getValue<BooleanSetting>("debugFPSGraph")) return;
                const p = 3, h = 10;
                const t = K.formatText({
                    text: (data.length / sum).toFixed(0),
                    anchor: "right",
                    pos: K.vec2(K.width() - p - p, p + h / 2),
                    size: 8,
                    font: GameManager.getDefaultValue("font"),
                });
                const w = data.length - 1 + p + p + t.width;
                K.drawRect({
                    pos: K.vec2(K.width() - w - p, p),
                    width: w,
                    height: h,
                    color: K.BLACK
                });
                K.drawFormattedText(t);
                for (var i = 0; i < data.length; i++) {
                    const f = 1 / data.at(index - i - 1);
                    const x = K.width() - p - p - p - t.width - i
                    K.drawLine({
                        p1: K.vec2(x, p + h),
                        p2: K.vec2(x, p + h - K.map(f, 0, 120, 0, h)),
                        color: f < 15 ? K.RED : f < 30 ? K.YELLOW : K.GREEN,
                        width: 1
                    })
                }
            }
        }
    ]);
}
