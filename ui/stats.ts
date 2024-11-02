import { UI } from ".";
import { MARGIN, SCALE } from "../constants";
import { K } from "../init";

const FPSIndicator = UI.add([
    K.text("", { size: 8 / SCALE }),
    K.pos(MARGIN, MARGIN),
    K.color(K.WHITE),
    K.layer("ui"),
]);
var frameCounter = 0, lastTime = 0;
K.onUpdate(() => frameCounter++);
setInterval(() => {
    const now = K.time();
    const fps = frameCounter / (now - lastTime);
    if (isNaN(fps)) {
        console.error("game is frozen??");
        return;
    }
    lastTime = now;
    frameCounter = 0;
    FPSIndicator.text = "FPS: " + fps.toFixed(2).padStart(6);
    if (fps < 20) FPSIndicator.color = K.RED;
    else if (fps < 30) FPSIndicator.color = K.YELLOW;
    else FPSIndicator.color = K.GREEN;
}, 100);

const countIndicator = UI.add([
    K.text("counting objects...", { size: 8 / SCALE }),
    K.pos(MARGIN, MARGIN + 12 / SCALE),
    K.color(K.WHITE),
    K.layer("ui"),
]);

var objectCount = 0;
function updateObjectCount() {
    countIndicator.text = objectCount + " objects";
    if (objectCount > 1000) countIndicator.color = K.RED;
    else if (objectCount > 300) countIndicator.color = K.YELLOW;
    else countIndicator.color = K.GREEN;
}

K.wait(0.1, () => {
    objectCount = K.get("*", { recursive: true }).length;
    updateObjectCount();
    K.onAdd(() => {
        objectCount++;
        updateObjectCount();
    });
    K.onDestroy(() => {
        objectCount--;
        updateObjectCount();
    });
});
