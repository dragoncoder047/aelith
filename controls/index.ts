import { AreaComp, Vec2 } from "kaplay";
import { FOOTSTEP_INTERVAL, MAX_THROW_STRETCH, MODIFY_SPEED, SCALE, SPRINT_FACTOR, TILE_SIZE, WALK_SPEED } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { nextFrame } from "../utils";
import { MParser } from "../assets/mparser";

// Controls

export function getMotionVector(): Vec2 {
    const leftstickRaw = K.getGamepadStick("left")//.reflect(K.RIGHT);
    const leftstick = leftstickRaw.slen() > 0.01 ? leftstickRaw : K.vec2(0);
    const keystick = K.vec2(
        (+K.isButtonDown("move_right")) - (+K.isButtonDown("move_left")),
        (+K.isButtonDown("move_down")) - (+K.isButtonDown("move_up")), // y increases downward
    ).unit();
    const factor = K.isButtonDown("sprint") ? SPRINT_FACTOR : 1;
    return leftstick.add(keystick).scale(factor);
}

function motionHandler() {
    var xy = getMotionVector();
    const len = xy.len();
    if (len === 0) return;
    if (player.intersectingAny("ladder") && Math.abs(xy.y) > 0.6) {
        if (player.state !== "climbing")
            player.enterState("climbing");
    } else {
        if (player.state === "climbing" && !player.intersectingAny("ladder"))
            player.enterState("normal");
    }
    if (player.state === "normal")
        xy = xy.reject(K.UP);
    player.move(xy.scale(WALK_SPEED));
    player.head?.move(xy.scale(WALK_SPEED));
    if (xy.x > 0)
        player.flipX = true;
    else if (xy.x < 0)
        player.flipX = false;
}
export const MANPAGE_CLOSED_HANDLERS = [
    player.onUpdate(motionHandler),

    player.onButtonPress("jump", () => {
        if (player.isGrounded() || player.state === "climbing") {
            player.jump();
            player.enterState("jump");
            if (!player.intersectingAny("button"))
                player.playSound("jump");
        }
    }),
    player.onButtonPress("throw", () => player.throw()),
    player.onButtonPress("interact", () => player.lookingAt?.trigger("interact")),
    player.onButtonPress("invoke", () => player.holdingItem?.trigger("invoke")),
    player.onButtonDown("invoke_increment", () => player.holdingItem?.trigger("modify", K.dt() * MODIFY_SPEED)),
    player.onButtonDown("invoke_decrement", () => player.holdingItem?.trigger("modify", -K.dt() * MODIFY_SPEED)),
    player.onScroll(xy => player.holdingItem?.trigger("modify", Math.round(K.clamp(-xy.y, -TILE_SIZE * K.dt() * MODIFY_SPEED, TILE_SIZE * K.dt() * MODIFY_SPEED)))),

    // Mouse looking
    player.onMouseMove(mousePos => {
        if (K.get<AreaComp>("ui-button", { recursive: true }).some(x => x.isHovering()))
            player.lookAt(undefined);
        // toWorld is darn bugged kaplayjs/kaplay#325
        else {
            const lookingWhere = K.toWorld(mousePos.scale(1 / SCALE));
            player.lookAt(lookingWhere.sdist(player.head!.worldPos()!) < 25 ? undefined : lookingWhere);
        }
    }),
    player.onGamepadStick("right", xy => {
        if (K.getLastInputDeviceType() !== "gamepad") return;
        if (xy.slen() < 0.01) {
            player.lookAt(undefined);
            return;
        }
        // do cubed for better control at low forces
        xy = xy.scale(xy.len());
        player.lookAt(xy.scale(MAX_THROW_STRETCH).add(player.head!.worldPos()!));
    }),

    // Inventory
    player.onButtonPress("inv_previous", () => player.scrollInventory(-1)),
    player.onButtonPress("inv_next", () => player.scrollInventory(1)),

    player.onButtonPress("view_info", () => showManpage(true)),

    // Footsteps sound effects when walking
    player.onUpdate(() => {
        var xy = getMotionVector();
        if (player.state == "normal") {
            if (xy.x === 0)
                xy = xy.reject(K.getGravityDirection());
            if (!player.isGrounded()) return;
        }
        if (player.state === "climbing" || player.state === "normal")
            player.footstepsCounter += K.dt() * xy.len();
        if (player.footstepsCounter >= FOOTSTEP_INTERVAL) {
            player.footstepsCounter = 0;
            player.playSound(player.state === "normal" ? "footsteps" : "climbing");
        }
    }),
];

function motionHandler2() {
    if (player.manpage!.needsToScroll)
        player.manpage!.scrollPos += getMotionVector().y * K.dt() * MODIFY_SPEED;
}

const MANPAGE_OPEN_HANDLERS = [
    player.onUpdate(motionHandler2),
    player.onScroll(xy => { if (player.manpage!.needsToScroll) player.manpage!.scrollPos += xy.y / 2 }),
    player.onButtonPress("view_info", () => showManpage(false)),
];

const MANPAGE_FORCE_ENTER_OPEN_HANDLERS = [
    player.onUpdate(motionHandler2),
    player.onScroll(xy => { if (player.manpage!.needsToScroll) player.manpage!.scrollPos += xy.y / 2 }),
    player.onKeyPress("escape", () => showManpage(false)),
];

export async function showManpage(isShown: boolean, importantMessage?: string, requireKeyboardToClose?: boolean) {
    var sound: string | undefined = "typing";
    if (!(player.holdingItem?.has("lore")) && importantMessage === undefined) {
        isShown = false;
        sound = undefined;
    }
    if (sound) player.playSound(sound);
    player.manpage!.hidden = !isShown;
    if (isShown) {
        MParser.pauseWorld(true);
        player.hidden = true;
        player.manpage!.data.requiresKeyboard = String(requireKeyboardToClose);
        if (importantMessage === undefined)
            player.recalculateManpage();
        else {
            Object.assign(player.manpage!, {
                section: "",
                sprite: undefined,
                header: "",
                body: importantMessage
            });
        }
    } else {
        MParser.pauseWorld(false);
        player.hidden = false;
    }
    await nextFrame();
    await nextFrame();
    const closedHandlersArePaused = isShown;
    const openHandlersArePaused = isShown ? !!requireKeyboardToClose : true;
    const specialHandlersArePaused = isShown ? !requireKeyboardToClose : true;
    MANPAGE_CLOSED_HANDLERS.forEach(h => h.paused = closedHandlersArePaused);
    MANPAGE_OPEN_HANDLERS.forEach(h => h.paused = openHandlersArePaused);
    MANPAGE_FORCE_ENTER_OPEN_HANDLERS.forEach(h => h.paused = specialHandlersArePaused);
}
const foo = player.onUpdate(() => {
    showManpage(false);
    foo.cancel();
});


/// xxx: where else to put these?
K.onGamepadButtonPress("home", async () => {
    if (K.isFullscreen()) {
        K.setFullscreen(false);
    } else {
        const el = K._k.app.state.canvas;
        console.log(el);
        // @ts-ignore
        await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.() ?? el.mozRequestFullScreen?.() ?? el.msRequestFullscreen?.());
        // _onFullscreenResized();
    }
});

// TODO: why does this not work?
// function _onFullscreenResized() {
//     const state = K._k.app.state;
//     state.lastWidth = state.canvas.offsetWidth;
//     state.lastHeight = state.canvas.offsetHeight;;
// }

K.onGamepadButtonPress("select", () => {
    K.debug.inspect = !K.debug.inspect;
});
