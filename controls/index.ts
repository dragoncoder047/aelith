import { AreaComp, BodyComp, ColorComp, GameObj, PosComp, Vec2 } from "kaplay";
import { PromiseComp } from "../components/promise";
import { MAX_THROW_STRETCH, MODIFY_SPEED, SCALE, SPRINT_FACTOR, TILE_SIZE, WALK_SPEED } from "../constants";
import { K } from "../init";
import { splash } from "../misc/particles";
import { player } from "../player";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";
import { nextFrame } from "../misc/utils";

// Controls

export function getMotionVector(): Vec2 {
    const leftstickRaw = K.getGamepadStick("left")//.reflect(K.RIGHT);
    const leftstick = leftstickRaw.slen() > 0.01 ? leftstickRaw : K.vec2(0);
    const keystick = K.eventGroups.has("menuActive") ? K.vec2(0) : K.vec2(
        (+K.isButtonDown("move_right")) - (+K.isButtonDown("move_left")),
        (+K.isButtonDown("move_down")) - (+K.isButtonDown("move_up")), // y increases downward
    ).unit();
    const sum = leftstick.add(keystick);
    const clampedSum = sum.slen() > 1 ? sum.unit() : sum;
    const factor = K.isButtonDown("sprint") ? SPRINT_FACTOR : 1;
    return clampedSum.scale(factor);
}

export function getPlayerMotionVector(): Vec2 {
    if (K.isButtonDown("flyUp") && _playerIsHoldingFlyingPromise()) return K.vec2(0);
    return getMotionVector();
}

function motionHandler() {
    var xy = getPlayerMotionVector();
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
(player.onUpdate(motionHandler) as KEventControllerPatch).forEventGroup("!dialog");

(player.onButtonPress("jump", () => {
    if (player.isGrounded() || player.state === "climbing") {
        player.jump();
        player.enterState("jump");
        if (!player.intersectingAny("button"))
            player.playSound("jump");
    }
}) as KEventControllerPatch).forEventGroup("!dialog");
(player.onButtonPress("throw", () => player.throw()) as KEventControllerPatch).forEventGroup("!dialog");
(player.onButtonPress("interact", () => player.lookingAt?.trigger("interact")) as KEventControllerPatch).forEventGroup("!dialog");
(player.onButtonPress("invoke", () => player.holdingItem?.trigger("invoke")) as KEventControllerPatch).forEventGroup("!dialog");
(player.onButtonPress("edit", () => player.holdingItem?.trigger("edit")) as KEventControllerPatch).forEventGroup("!dialog");
(player.onButtonDown("invoke_increment", () => player.holdingItem?.trigger("modify", K.dt() * MODIFY_SPEED)) as KEventControllerPatch).forEventGroup("!dialog");
(player.onButtonDown("invoke_decrement", () => player.holdingItem?.trigger("modify", -K.dt() * MODIFY_SPEED)) as KEventControllerPatch).forEventGroup("!dialog");
(player.onScroll(xy => player.holdingItem?.trigger("modify", Math.round(K.clamp(-xy.y, -TILE_SIZE * K.dt() * MODIFY_SPEED, TILE_SIZE * K.dt() * MODIFY_SPEED)))) as KEventControllerPatch).forEventGroup("!dialog");

function _playerIsHoldingFlyingPromise() {
    if (player.holdingItem && player.holdingItem.has("promise")) {
        const c = (player.holdingItem as any as GameObj<PromiseComp>).controlling;
        if (c.data?.flyingEnabled) return true;
    }
    return false;
}
(player.onButtonDown("flyUp", () => {
    if (_playerIsHoldingFlyingPromise()) {
        const c: GameObj<PosComp | BodyComp | ColorComp> = (player.holdingItem as any).controlling;
        c.gravityScale = 0;
        c.vel = K.vec2(0);
        if (c.curPlatform()) c.jump(1);
        c.move(getMotionVector().scale(WALK_SPEED));
        splash(c.pos, c.color, 5, -10);
        return;
    }
    if (!(player.holdingItem as any)?.data?.flyingEnabled) {
        K.rumble("cant_fly");
        return;
    }
    if (player.state === "normal") {
        player.gravityScale = -1;
        if (player.vel.slen() > WALK_SPEED * WALK_SPEED) {
            player.vel = player.vel.unit().scale(WALK_SPEED);
        }
        splash(player.pos.add(0, player.height / 2), (player.holdingItem as any).color, 5, -10);
    }
}) as KEventControllerPatch).forEventGroup("!dialog");
player.onButtonRelease("flyUp", () => {
    if (_playerIsHoldingFlyingPromise()) {
        const c: GameObj<PosComp | BodyComp> = (player.holdingItem as any).controlling;
        c.gravityScale = 1;
    }
    if (player.state === "normal") {
        player.gravityScale = 1;
    }
}); // not in dialog EV group cause if player opens dialog when holding fly button then this gets stuck wrongly

// Mouse looking
(player.onMouseMove(mousePos => {
    if (K.get<AreaComp>("ui-button", { recursive: true }).some(x => x.isHovering()))
        player.lookAt(undefined);
    // toWorld is darn bugged kaplayjs/kaplay#325
    else {
        const lookingWhere = K.toWorld(mousePos);
        player.lookAt(lookingWhere.sdist(player.head!.worldPos()!) < 25 ? undefined : lookingWhere);
    }
}) as KEventControllerPatch).forEventGroup("!dialog");
(player.onGamepadStick("right", xy => {
    if (K.getLastInputDeviceType() !== "gamepad") return;
    if (xy.slen() < 0.01) {
        player.lookAt(undefined);
        return;
    }
    // do cubed for better control at low forces
    xy = xy.scale(xy.len());
    player.lookAt(xy.scale(MAX_THROW_STRETCH).add(player.head!.worldPos()!));
}) as KEventControllerPatch).forEventGroup("!dialog");

// Inventory
(player.onButtonPress("inv_previous", () => player.scrollInventory(-1)) as KEventControllerPatch).forEventGroup("!dialog");
(player.onButtonPress("inv_next", () => player.scrollInventory(1)) as KEventControllerPatch).forEventGroup("!dialog");

(player.onButtonPress("view_info", () => showManpage(true)) as KEventControllerPatch).forEventGroup("!dialog");

function motionHandler2() {
    if (player.manpage!.needsToScroll)
        player.manpage!.scrollPos += getMotionVector().y * K.dt() * MODIFY_SPEED;
}

(player.onUpdate(motionHandler2) as KEventControllerPatch).forEventGroup("dialog");
(player.onScroll(xy => { if (player.manpage!.needsToScroll) player.manpage!.scrollPos += xy.y / 2 }) as KEventControllerPatch).forEventGroup("dialog");
K.onUpdate(() => K.eventGroups.has("pauseMenu") && motionHandler2());
K.onScroll(xy => { if (player.manpage!.needsToScroll && K.eventGroups.has("pauseMenu")) player.manpage!.scrollPos += xy.y / 2 });
(player.onButtonPress("view_info", () => showManpage(false)) as KEventControllerPatch).forEventGroup(["dialog", "!specialDialog"]);
(player.onKeyPress("escape", () => showManpage(false)) as KEventControllerPatch).forEventGroup("specialDialog");

export async function showManpage(isShown: boolean, importantMessage?: string, requireKeyboardToClose?: boolean) {
    var sound: string | undefined = "typing";
    if (!(player.holdingItem?.has("lore")) && importantMessage === undefined) {
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
