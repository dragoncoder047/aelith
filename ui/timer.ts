import { GameObj, PosComp } from "kaplay";
import { UI } from ".";
import { MARGIN, SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";

export const timer = UI.add([
    K.text("", { size: 24 / SCALE, width: TILE_SIZE * 8, align: "right" }),
    K.anchor("topright"),
    K.pos(),
    K.opacity(1),
    {
        update(this: GameObj<PosComp>) {
            this.pos = K.vec2(K.width() - MARGIN, MARGIN);
        }
    }
]);

timer.hidden = true;

var timerValue = 0;
K.onUpdate(() => {
    if (!player.hidden) {
        timerValue += K.dt();
        timer.hidden = false;
    }
    timer.text = `${Math.floor(timerValue / 60)}:${(timerValue % 60).toFixed(4)}`.replace(/:(\d)\./, ":0$1.");
});
