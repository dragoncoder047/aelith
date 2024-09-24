// cSpell: ignore kaplay

import {
    AreaCompOpt,
    CompList,
    GameObj,
    LevelComp
} from 'kaplay';
import './assets/loadLevel';
import { MParser } from './assets/mparser';
import { boxComp } from './components/box';
import { grabbable } from './components/grabbable';
import { hoverOutline } from './components/hoverOutline';
import { infFriction } from './components/infFriction';
import { linked } from './components/linked';
import { thudder } from './components/thudder';
import { toggler } from './components/toggler';
import {
    BAP_OPTS,
    FOOTSTEP_INTERVAL,
    TILE_SIZE
} from './constants';
import { shouldMoveDown, shouldMoveLeft, shouldMoveRight, shouldMoveUp } from './controlsImpl';
import { cursor } from './cursor';
import './cursorControlsImpl';
import K from './init';
import './layers';
import { player } from './player';
import './playerStateManage';

export var world: GameObj<LevelComp>;


/**
 * Create default components for common tile objects.
 */
export function defaults(areaOpts?: AreaCompOpt): CompList<any> {
    return [
        K.area(areaOpts!),
        K.anchor("center"),
        K.offscreen({ hide: true }),
        K.timer(),
        K.rotate(0),
        K.outline(0, K.WHITE),
    ];
}

/**
 * Return components for a machine
 */
export function machine(areaOpts?: AreaCompOpt): CompList<any> {
    return [
        toggler("off", "on", false),
        K.state("off"),
        linked(MParser.uid()),
        ...defaults(areaOpts)
    ];
}

/**
 * Components for a moveable, grabbable box.
 */
export function box(): CompList<any> {
    return [
        K.sprite("box", { fill: false }),
        "box",
        K.body(),
        // make box a teeny bit smaller so that it fits down holes
        // and I don't have to stomp on it
        ...machine({ scale: (TILE_SIZE - 1) / TILE_SIZE }),
        hoverOutline(),
        K.tile({ isObstacle: true }),
        thudder(),
        grabbable(),
        K.z(0),
        infFriction(),
        boxComp()
    ];
}

// set gravity for platformer
K.setGravity(600);

// Keep player centered in window
const follower = player.onUpdate(() => {
    K.camPos(player.worldPos()!);
});

// custom thud, not using thudder component
player.onGround(() => {
    console.log("thud");
    if (!player.intersectingAny("button")) {
        K.play("thud", { detune: -500 });
    }
});


// Footsteps sound effects when walking
var footstepsCounter = 0;
player.onUpdate(() => {
    if (player.state == "normal") footstepsCounter += K.dt() * (+((shouldMoveLeft() || shouldMoveRight()) && player.isGrounded()))
    else if (player.state == "climbing") footstepsCounter += K.dt() * (+(shouldMoveLeft() || shouldMoveRight() || shouldMoveUp() || shouldMoveDown()))
    if (footstepsCounter >= FOOTSTEP_INTERVAL) {
        footstepsCounter = 0;
        K.play("bap", BAP_OPTS[player.state]?.());
    }
});

/* -------------------- UI --------------------- */

const UI = K.add([K.fixed(), K.layer("ui")]);

const FPSindicator = UI.add([
    K.text("", { size: 8, font: "unscii", }), // cSpell: ignore unscii
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

// setTimeout(() => K.debug.paused = true, 100);
// K.debug.inspect = true;
// follower.paused = true;
// K.debug.timeScale = 0.2;

if (!(player.layerIndex! < cursor.layerIndex!)) K.debug.error("Blooey!");
