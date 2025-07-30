import { AreaComp, Vec2 } from "kaplay";
import { MAX_THROW_STRETCH, MODIFY_SPEED, SPRINT_FACTOR, STICK_DEADZONE, WALK_SPEED } from "../constants";
import { K } from "../init";
import { nextFrame } from "../misc/utils";
import { player } from "../player";
import { hintFlags } from "../player/body";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";

function getMotionVector(): Vec2 {
    const leftstickRaw = K.getGamepadStick("left")//.reflect(K.RIGHT);
    const leftstick = leftstickRaw.slen() > (STICK_DEADZONE * STICK_DEADZONE) ? leftstickRaw : K.vec2(0);
    const keystick = K.eventGroups.has("menuActive") ? K.vec2(0) : K.vec2(
        (+K.isButtonDown("move_right")) - (+K.isButtonDown("move_left")),
        (+K.isButtonDown("move_down")) - (+K.isButtonDown("move_up")), // y increases downward
    ).unit();
    const sum = leftstick.add(keystick);
    const clampedSum = sum.slen() > 1 ? sum.unit() : sum;
    const factor = K.isButtonDown("sprint") ? SPRINT_FACTOR : 1;
    return clampedSum.scale(factor);
}

K.onUpdate(() => {
    var xy = getMotionVector();
    if (player.paused || K.eventGroups.has("dialog")) { // this onUpdate doesn't return a KEventControllerPatch... wtf
        player.lastMotionVector = xy;
        return;
    }
    if (player.holdingItem?.motionHandler?.(xy)) {
        player.lastMotionVector = K.vec2(0);
        player.enterState("normal");
        return;
    }
    player.lastMotionVector = xy;

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
});

(player.onButtonPress("jump", () => {
    if (player.isGrounded() || player.state === "climbing") {
        player.jump();
        player.enterState("jump");
        if (!player.intersectingAny("button"))
            player.playSound("jump");
    }
}) as KEventControllerPatch).forEventGroup("!dialog");

(player.onButtonPress("throw", () => player.throw()) as KEventControllerPatch).forEventGroup("!dialog");

for (const btn of ["action1", "action2", "action3", "action4"] as const) {
    (player.onButtonPress(btn, () => {
        const obj = player.holdingItem;
        if (obj) {
            if (obj[btn]?.(player.lookingAt)) {
                obj.specialFlags &= ~hintFlags[btn];
            }
        }
    }) as KEventControllerPatch).forEventGroup("!dialog");
}
for (const btn2 of ["target1", "target2"] as const) {
    (player.onButtonPress(btn2, () => {
        const obj = player.lookingAt;
        if (obj) {
            if (obj[btn2]?.()) {
                obj.specialFlags &= ~hintFlags[btn2];
            }
        }
    }) as KEventControllerPatch).forEventGroup("!dialog");
}

// Mouse looking
(player.onMouseMove(mousePos => {
    if (K.get<AreaComp>("ui-button", { recursive: true }).some(x => x.isHovering()))
        player.lookAt(undefined);
    else {
        const lookingWhere = K.toWorld(mousePos);
        player.lookAt(lookingWhere.sdist(player.head!.worldPos()!) < 25 ? undefined : lookingWhere);
    }
}) as KEventControllerPatch).forEventGroup("!dialog");
(player.onKeyPress(() => {
    player.lookAt(undefined);
}) as KEventControllerPatch).forEventGroup("!dialog");

(player.onGamepadStick("right", xy => {
    if (K.getLastInputDeviceType() !== "gamepad") return;
    if (xy.slen() < 0.01) {
        player.lookAt(undefined);
        return;
    }
    // do squared for better control at low forces
    xy = xy.scale(xy.len());
    player.lookAt(xy.scale(MAX_THROW_STRETCH).add(player.head!.worldPos()!));
}) as KEventControllerPatch).forEventGroup("!dialog");

// Inventory
(player.onButtonPress("inv_previous", () => player.scrollInventory(-1)) as KEventControllerPatch).forEventGroup("!dialog");
(player.onButtonPress("inv_next", () => player.scrollInventory(1)) as KEventControllerPatch).forEventGroup("!dialog");

(player.onButtonPress("read_manpage", () => showManpage(true)) as KEventControllerPatch).forEventGroup("!dialog");

function motionHandler2() {
    if (player.manpage!.needsToScroll)
        player.manpage!.scrollPos += getMotionVector().y * K.dt() * MODIFY_SPEED;
}

(player.onUpdate(motionHandler2) as KEventControllerPatch).forEventGroup("dialog");
(player.onScroll(xy => {
    if (player.manpage!.needsToScroll) {
        player.manpage!.scrollPos += xy.y / 2;
    }
}) as KEventControllerPatch).forEventGroup("dialog");
K.onUpdate(() => K.eventGroups.has("pauseMenu") && motionHandler2());
K.onScroll(xy => {
    if (player.manpage!.needsToScroll && K.eventGroups.has("pauseMenu"))
        player.manpage!.scrollPos += xy.y / 2;
});
(player.onButtonPress("read_manpage", () => showManpage(false)) as KEventControllerPatch).forEventGroup(["dialog", "!specialDialog"]);
(player.onKeyPress("escape", () => showManpage(false)) as KEventControllerPatch).forEventGroup("specialDialog");

export async function showManpage(isShown: boolean, importantMessage?: string, requireKeyboardToClose?: boolean) {
    var sound: string | undefined = "typing";
    if (!(player.holdingItem?.manpage) && importantMessage === undefined) {
        isShown = false;
        sound = undefined;
    }
    if (sound) player.playSound(sound);
    player.manpage!.hidden = !isShown;
    if (isShown) {
        player.hidden = true;
        player.manpage!.data.requiresKeyboard = String(requireKeyboardToClose);
        if (importantMessage === undefined)
            player.recalculateManpage();
        else {
            Object.assign(player.manpage!, {
                section: "",
                sprite: undefined,
                header: "",
                body: importantMessage,
                showFooter: false
            });
        }
    } else {
        player.hidden = false;
        player.manpage!.hidden = true;
    }
    await nextFrame();
    await nextFrame();
    if (isShown) {
        K.eventGroups.add("dialog");
        if (requireKeyboardToClose) K.eventGroups.add("specialDialog");
        else K.eventGroups.delete("specialDialog");
    } else {
        K.eventGroups.delete("dialog");
        K.eventGroups.delete("specialDialog");
    }
}
player.onUpdate(() => {
    showManpage(false);
    return K.cancel();
});


/// xxx: where else to put these?
// K.onGamepadButtonPress("home", async () => {
//     if (K.isFullscreen()) {
//         K.setFullscreen(false);
//     } else {
//         const el = K._k.app.state.canvas;
//         console.log(el);
//         // @ts-ignore
//         await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.() ?? el.mozRequestFullScreen?.() ?? el.msRequestFullscreen?.());
//         // _onFullscreenResized();
//     }
// });

// TODO: why does this not work?
// function _onFullscreenResized() {
//     const state = K._k.app.state;
//     state.lastWidth = state.canvas.offsetWidth;
//     state.lastHeight = state.canvas.offsetHeight;;
// }

K.onGamepadButtonPress("select", () => {
    K.debug.inspect = !K.debug.inspect;
});
