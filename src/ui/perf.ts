import { GameObj } from "kaplay";
import { UI } from ".";
import { MARGIN, SCALE } from "../constants";
import { K } from "../init";

const fpsIndicator = UI.add([
    K.text("", { size: 16 / SCALE }),
    K.pos(MARGIN, MARGIN),
    K.color(K.WHITE),
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
    K.text("counting objects...", { size: 16 / SCALE }),
    K.pos(MARGIN, MARGIN + 16 / SCALE),
    K.color(K.WHITE),
    K.layer("ui"),
]);

function activeObjectsUnder(obj: GameObj): number {
    return obj.paused ? 0 : obj.children.reduce((acc, x) => acc + activeObjectsUnder(x), 1);
}

function updateObjectCount() {
    const objectCount = activeObjectsUnder(K.getTreeRoot());
    countIndicator.text = objectCount + " active objects";
    if (objectCount > 1000) countIndicator.color = K.RED;
    else if (objectCount > 500) countIndicator.color = K.YELLOW;
    else countIndicator.color = K.GREEN;
}
K.loop(1, updateObjectCount);

const drawIndicator = UI.add([
    K.text("analyzing...", { size: 16 / SCALE }),
    K.pos(MARGIN, MARGIN + 32 / SCALE),
    K.color(K.WHITE),
    K.layer("ui"),
]);

K.system("analyze", () => {
    drawIndicator.text = `${K.debug.drawCalls()} draw calls last frame`;
}, [K.SystemPhase.AfterDraw]);

const loadIndicator = UI.add([
    K.text("analyzing...", { size: 16 / SCALE }),
    K.pos(MARGIN, MARGIN + 48 / SCALE),
    K.color(K.WHITE),
    K.layer("ui"),
]);

var startUpdate = 0;
var endUpdate = 0;
var startDraw = 0;
var endDraw = 0;
var startFixedUpdate = 0;
var endFixedUpdate = 0;
var physicsLoad = 0;
var updateT = 0;

K.system("analyze_fixedUpdate_before", () => {
    startFixedUpdate = performance.now() / 1000;
}, [K.SystemPhase.BeforeFixedUpdate]);
const xx = K._k.game.systemsByEvent[K.SystemPhase.BeforeFixedUpdate];
xx.unshift(xx.pop()!);

K.system("analyze_update_before", () => {
    startUpdate = performance.now() / 1000;
}, [K.SystemPhase.BeforeUpdate]);
const yy = K._k.game.systemsByEvent[K.SystemPhase.BeforeUpdate];
yy.unshift(yy.pop()!);

K.system("analyze_draw_before", () => {
    startDraw = performance.now() / 1000;
}, [K.SystemPhase.BeforeDraw]);
const zz = K._k.game.systemsByEvent[K.SystemPhase.BeforeDraw];
zz.unshift(zz.pop()!);

K.system("analyze_fixedUpdate_after", () => {
    endFixedUpdate = performance.now() / 1000;
    physicsLoad = ((endFixedUpdate - startFixedUpdate) / K.fixedDt() * 100);
}, [K.SystemPhase.AfterFixedUpdate]);

K.system("analyze_update_after", () => {
    endUpdate = performance.now() / 1000
}, [K.SystemPhase.AfterUpdate]);

K.system("analyze_draw_after", () => {
    endDraw = performance.now() / 1000;
    updateT += K.dt();
    if (updateT > 0.5) {
        const updateLoad = ((endUpdate - startUpdate) / K.dt() * 100);
        const drawLoad = ((endDraw - startDraw) / K.dt() * 100);
        loadIndicator.text = `physics ${physicsLoad.toFixed(2)}%\nupdate  ${updateLoad.toFixed(2)}%\ndraw    ${drawLoad.toFixed(2)}%`;
        updateT = 0;
    }
}, [K.SystemPhase.AfterDraw]);
