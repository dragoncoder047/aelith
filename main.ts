// cSpell: ignore kaplay

import { K } from "./init";
import './layers';

import './assets/loadLevel';
import {
    BAP_OPTS,
    FOOTSTEP_INTERVAL
} from "./constants";
import { getMotionVector } from "./controlsImpl";
import './cursor';
import './cursorControlsImpl';
import { player } from "./player";
import './playerStateManage';

// set gravity for platformer
K.setGravity(600);

// Keep player centered in window
const follower = player.onUpdate(() => {
    K.camPos(player.worldPos()!);
});

// custom thud, not using thudder component
player.onGround(() => {
    if (!player.intersectingAny("button")) {
        K.play("thud", { detune: -500 });
    }
});


// Footsteps sound effects when walking
var footstepsCounter = 0;
player.onUpdate(() => {
    var xy = getMotionVector();
    if (player.state == "normal") {
        if (xy.x === 0)
            xy = xy.reject(K.getGravityDirection());
        if (!player.isGrounded()) xy = xy.scale(0);
    }
    if (player.state === "climbing" || player.state === "normal")
        footstepsCounter += K.dt() * xy.len();
    if (footstepsCounter >= FOOTSTEP_INTERVAL) {
        footstepsCounter = 0;
        K.play("bap", BAP_OPTS[player.state]?.());
    }
});

/* -------------------- UI --------------------- */

const UI = K.add([K.fixed(), K.layer("ui")]);

const FPSindicator = UI.add([
    K.text("", { size: 8, font: "IBM Mono", }),
    K.pos(10, 10),
    K.layer("ui"),
])

K.loop(0.1, () => {
    const fps = 1.0 / K.dt();
    FPSindicator.text = "FPS: " + fps.toFixed(2);
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
