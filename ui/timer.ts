import { GameObj, PosComp } from "kaplay";
import { UI } from ".";
import { MARGIN, SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";

export const timer = UI.add([
    K.text("", {
        size: 24 / SCALE,
        width: TILE_SIZE * 8,
        align: "right",
        font: "Unscii MCR"
    }),
    K.anchor("topright"),
    K.pos(),
    K.fixed(),
    K.layer("ui"),
    K.opacity(1),
    {
        add(this: GameObj<PosComp>) {
            const func = () => {
                this.pos = K.vec2(K.width() - MARGIN, MARGIN);
            };
            K.onResize(func);
            func();
        },
        value: 0
    }
]);

timer.hidden = true;
K.onUpdate(() => {
    if (!player.hidden) {
        timer.value += K.dt();
        timer.hidden = false;
        // it can still be hidden by setting the opacity to 0
    }
    K.strings.time = timer.text = `${Math.floor(timer.value / 60)}:${(timer.value % 60).toFixed(3)}`.replace(/:(\d)\./, ":0$1.");
});
