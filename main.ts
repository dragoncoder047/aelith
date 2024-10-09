// cSpell: ignore kaplay

import { K } from "./init";
import "./layers";

import "./assets/loadLevel";
import {
    GRAVITY
} from "./constants";
import "./controlsImpl";
import "./cursor";
import "./cursorControlsImpl";
import { player } from "./player";
import "./playerStateManage";

K.setGravity(GRAVITY);
const follower = player.camFollower!;

/* -------------------- UI --------------------- */

const UI = K.add([K.fixed(), K.layer("ui")]);

const FPSindicator = UI.add([
    K.text("", { size: 8, font: "IBM Mono", }),
    K.pos(10, 10),
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

// setTimeout(() => K.debug.paused = true, 600);
// K.debug.inspect = true;
// follower.paused = true;
// K.debug.timeScale = 0.2;
