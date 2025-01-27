import { player } from ".";
import { FOOTSTEP_INTERVAL } from "../constants";
import { getMotionVector } from "../controls";
import { K } from "../init";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";

// State functions
player.onStateUpdate("normal", () => {
    if (player.isGrounded() && Math.abs(getMotionVector().x) > Number.EPSILON) {
        if (player.getCurAnim()?.name != "walking") player.play("walking");
        player.animSpeed = Math.abs(getMotionVector().x);
    }
    else {
        if (player.getCurAnim()?.name != "idle") player.play("idle");
        player.animSpeed = 1;
    }
});
player.onStateEnter("jump", () => {
    player.animSpeed = 1;
    player.play("jump", { onEnd() { player.enterState("normal"); } });
});
player.onStateEnter("climbing", () => {
    player.gravityScale = 0;
    player.damping = Number.MAX_VALUE;
    player.mass = Number.MAX_VALUE;
    player.vel = K.vec2(0);
    player.play("climbing");
    player.flipX = false;
});
player.onStateUpdate("climbing", () => {
    if (!player.intersectingAny("ladder")) {
        player.enterState("normal");
    }
    player.animSpeed = getMotionVector().len();
});
player.onStateEnd("climbing", () => {
    player.gravityScale = 1;
    player.damping = 0;
    player.animSpeed = 1;
    player.mass = 1;
});

// Footsteps sound effects when walking
(player.onUpdate(() => {
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
        player.playSound(player.state === "normal" ? (player.curPlatform()?.sprite == "grating" ? "footsteps_metal" : "footsteps") : "climbing");
    }
}) as KEventControllerPatch).forEventGroup("!dialog");
