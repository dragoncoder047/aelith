import { GameObj, PosComp, TextComp } from "kaplay";
import { UI } from ".";
import { MARGIN, SCALE } from "../constants";
import { K } from "../init";
import { musicPlay } from "../assets";


const musicButton = UI.add([
    K.text("\u000e", { size: 24 / SCALE }),
    K.pos(),
    K.color(K.WHITE),
    K.anchor("botright"),
    K.layer("ui"),
    K.fixed(),
    K.area(),
    {
        enabled: true,
        update(this: GameObj<PosComp | TextComp>) {
            this.pos.x = K.width() - MARGIN;
            this.pos.y = K.height() - MARGIN;
        },
        draw() {
            // @ts-ignore
            if (!this.enabled) {
                K.drawLine({
                    p1: K.vec2(0),
                    // @ts-ignore
                    p2: K.vec2(-this.width, -this.height),
                    width: 2 / SCALE,
                    color: K.RED,
                });
                K.drawLine({
                    // @ts-ignore
                    p1: K.vec2(-this.width, 0),
                    // @ts-ignore
                    p2: K.vec2(0, -this.height),
                    width: 2 / SCALE,
                    color: K.RED,
                });
            }
        }
    }
]);

musicButton.onClick(() => {
    musicButton.enabled = !musicButton.enabled;
    musicPlay.paused = !musicButton.enabled;
});

musicButton.hidden = musicButton.paused = true;

const zz = K.onUpdate("player", () => {
    musicButton.hidden = musicButton.paused = false;
    zz.cancel();
});
