import { K } from "../../src/context";
import * as GameManager from "../GameManager";
import { BooleanSetting } from "../settings";
import { SYSTEM_SETTINGS } from "./systemMenus";

K._k.app.state.fpsCounter.resize(100)
export function install() {
    K.add([
        K.layer(K._k.game.layers!.at(-1)!),
        K.fixed(),
        {
            draw() {
                if (!SYSTEM_SETTINGS.getValue<BooleanSetting>("debugFPSGraph")) return;
                const p = 3, h = 10;
                const c = K._k.app.state.fpsCounter;
                const t = K.formatText({
                    text: c.calculate().toFixed(0).padStart(3),
                    anchor: "right",
                    pos: K.vec2(K.width() - p * 2, p + h / 2),
                    size: 8,
                    font: GameManager.getDefaultValue("font"),
                });
                const w = c.maxSamples - 1 + p * 2 + t.width;
                K.drawRect({
                    pos: K.vec2(K.width() - w - p, p),
                    width: w,
                    height: h,
                    color: K.BLACK
                });
                K.drawFormattedText(t);
                for (var i = 0; i < c.maxSamples; i++) {
                    const f = 1 / c.ago(i)!;
                    const x = K.width() - p * 3 - t.width - i
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
