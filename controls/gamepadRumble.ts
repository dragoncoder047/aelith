import { GameObj, KEventController, OffScreenComp, PosComp, Vec2 } from "kaplay";
import { K } from "../init";
import { player } from "../player";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";

function rumbleEffectAndWait(effect: string, controller: KEventController) {
    controller.paused = true;
    K.rumble(effect).then(() => controller.paused = false);
}

player.onHurt(() => { if (player.hp > 0) K.rumble("hurt"); });
player.onDeath(() => K.rumble("died"));
const icc = (player.on("inventoryChange", () => {
    if (player.holdingItem?.has("continuation-trap")) K.rumble("get_continuation_trap");
    if (player.holdingItem?.has("continuation")) K.rumble("get_continuation");
    if (player.holdingItem?.has("promise")) K.rumble("get_promise");
}) as KEventControllerPatch).forEventGroup("!notReallyChangingInventory");
player.on("teleport", () => rumbleEffectAndWait("teleport", icc));

const bbk = player.onCollideUpdate("barrier", (_, coll) => {
    if (coll?.isLeft()) rumbleEffectAndWait("barrier_left", bbk);
    if (coll?.isRight()) rumbleEffectAndWait("barrier_right", bbk);
    if (coll?.isTop()) rumbleEffectAndWait("barrier_middle", bbk);
});

player.on("remoteSense", (normal: Vec2 | undefined, trap: GameObj<PosComp | OffScreenComp>) => {
    normal ??= K.UP;
    if (trap.isOffScreen()) {
        const spos = K.toScreen(trap.toWorld(trap.pos));
        K.rumble(spos.x < 0 ? "barrier_left" : spos.x > K.width() ? "barrier_right" : "barrier_middle");
    } else {
        K.rumble(normal.x < 0 ? "barrier_left" : normal.x > 0 ? "barrier_right" : "barrier_middle");
    }
});
