import { UI } from ".";
import { MARGIN, SCALE } from "../constants";
import { K } from "../init";


const FPSIndicator = UI.add([
    K.text("", { size: 8 / SCALE, font: "IBM Mono" }),
    K.pos(MARGIN, MARGIN),
    K.color(K.WHITE),
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
    FPSIndicator.text = "FPS: " + fps.toFixed(2).padStart(6);
    if (fps < 15) {
        FPSIndicator.color = K.RED;
    }
    else if (fps < 20) {
        FPSIndicator.color = K.YELLOW;
    }
    else {
        FPSIndicator.color = K.GREEN;
    }
});

const countIndicator = UI.add([
    K.text("counting objects...", { size: 8 / SCALE, font: "IBM Mono" }),
    K.pos(MARGIN, MARGIN + 12 / SCALE),
    K.color(K.WHITE),
    K.layer("ui"),
]);

K.loop(0.1, () => {
    const objects = K.get("*", { recursive: true }).length;
    countIndicator.text = objects + " objects";
    if (objects > 150) {
        countIndicator.color = K.RED;
    }
    else if (objects > 70) {
        countIndicator.color = K.YELLOW;
    }
    else {
        countIndicator.color = K.GREEN;
    }
});
