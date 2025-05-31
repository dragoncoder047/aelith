import { GameObj } from "kaplay";
import { UI } from ".";
import { MARGIN, SCALE } from "../constants";
import { K } from "../init";

const fpsIndicator = UI.add([
    K.text("", { size: 8 / SCALE }),
    K.pos(MARGIN, MARGIN),
    K.color(K.WHITE),
    K.fixed(),
    K.layer("ui"),
]);
var frameCounter = 0, lastTime = performance.now();
K.onUpdate(() => frameCounter++);
setInterval(() => {
    const now = performance.now();
    const fps = frameCounter * 1000 / (now - lastTime);
    if (isNaN(fps)) {
        console.error("game is frozen??");
        return;
    }
    lastTime = now;
    frameCounter = 0;
    fpsIndicator.text = "FPS: " + fps.toFixed(2).padStart(6);
    if (fps < 20) fpsIndicator.color = K.RED;
    else if (fps < 30) fpsIndicator.color = K.YELLOW;
    else fpsIndicator.color = K.GREEN;
}, 100);

const countIndicator = UI.add([
    K.text("counting objects...", { size: 8 / SCALE }),
    K.pos(MARGIN, MARGIN + 12 / SCALE),
    K.color(K.WHITE),
    K.fixed(),
    K.layer("ui"),
]);

function activeObjectsUnder(obj: GameObj): number {
    return obj.paused ? 0 : obj.children.reduce((acc, x) => acc + activeObjectsUnder(x), 1);
}

function updateObjectCount() {
    const objectCount = activeObjectsUnder(K.getTreeRoot());
    countIndicator.text = objectCount + " active objects";
    if (objectCount > 1000) countIndicator.color = K.RED;
    else if (objectCount > 300) countIndicator.color = K.YELLOW;
    else countIndicator.color = K.GREEN;
}
K.loop(1, updateObjectCount);
