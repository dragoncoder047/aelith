import { UI } from ".";
import { MARGIN, SCALE } from "../constants";
import { K } from "../init";


const FPSindicator = UI.add([
    K.text("", { size: 8 / SCALE, font: "IBM Mono" }),
    K.pos(MARGIN, MARGIN),
    K.layer("ui"),
]);
var frameCounter = 0;
var lastTime = 0;
K.onUpdate(() => frameCounter++);
K.loop(0.1, () => {
    const now = K.time();
    const fps = frameCounter / (now - lastTime);
    lastTime = now;
    frameCounter = 0;
    FPSindicator.text = "FPS: " + fps.toFixed(2).padStart(6);
    if (fps < 15) {
        // @ts-expect-error
        // tsc says these shouldn't work... but they do. What gives?
        FPSindicator.color = K.RED;
    }
    else if (fps < 20) {
        // @ts-expect-error
        FPSindicator.color = K.YELLOW;
    }
    else {
        // @ts-expect-error
        FPSindicator.color = K.GREEN;
    }
});
