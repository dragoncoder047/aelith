import { AreaComp, Vec2 } from "kaplay";
import { FOOTSTEP_INTERVAL, MAX_THROW_STRETCH, MODIFY_SPEED, SCALE, SPRINT_FACTOR, TILE_SIZE, WALK_SPEED } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { nextFrame } from "../utils";

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
        else player.lookAt(K.toWorld(mousePos.scale(1 / SCALE)));
    }),
    player.onGamepadStick("right", xy => {
        if (xy.slen() < 0.01) return;
        // do squared for better control at low forces
        xy.x *= Math.abs(xy.x);
        xy.y *= Math.abs(xy.y);
        player.lookAt(xy.scale(MAX_THROW_STRETCH).add(player.headPosWorld));
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
        player.manpage!.scrollPos += getMotionVector().y * K.dt() * MODIFY_SPEED * 20;
}

const MANPAGE_OPEN_HANDLERS = [
    player.onUpdate(motionHandler2),
    player.onScroll(xy => { if (player.manpage!.needsToScroll) player.manpage!.scrollPos += xy.y / 2 }),
    player.onButtonPress("view_info", () => showManpage(false)),
];

export async function showManpage(isShown: boolean) {
    var sound: string | undefined = "typing";
    if (!(player.holdingItem?.has("lore"))) {
        isShown = false;
        sound = undefined;
    }
    if (sound) player.playSound(sound);
    player.manpage!.hidden = !isShown;
    if (isShown) player.recalculateManpage();
    await nextFrame();
    await nextFrame();
    MANPAGE_CLOSED_HANDLERS.forEach(h => h.paused = isShown);
    MANPAGE_OPEN_HANDLERS.forEach(h => h.paused = !isShown);
}
const foo = player.onUpdate(() => {
    showManpage(false);
    foo.cancel();
});
