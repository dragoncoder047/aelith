import { player } from "../player";
import { K } from "../init";
import { KEventController } from "kaplay";

function rumbleEffectAndWait(effect: string, controller: KEventController) {
    controller.paused = true;
    K.rumble(effect).then(() => controller.paused = false);
}

player.onHurt(() => { if (player.hp > 0) K.rumble("hurt"); });
player.onDeath(() => K.rumble("died"));
const icc = player.on("inventoryChange", () => {
    if (player.holdingItem?.has("continuation-trap")) K.rumble("get_continuation_trap");
    if (player.holdingItem?.has("continuation")) K.rumble("get_continuation");
});
player.on("teleport", () => rumbleEffectAndWait("teleport", icc));

const bbk = player.onCollideUpdate("barrier", (_, coll) => {
    if (coll?.isLeft()) rumbleEffectAndWait("barrier_left", bbk);
    if (coll?.isRight()) rumbleEffectAndWait("barrier_right", bbk);
});

const hpK = player.onUpdate(() => {
    if (player.holdingItem?.has("promise")) rumbleEffectAndWait("holding_promise", hpK);
});
