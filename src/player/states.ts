import { player } from ".";
import { FOOTSTEP_INTERVAL } from "../constants";
import { K } from "../init";
import { splash } from "../misc/particles";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";

// State functions
player.onStateUpdate("normal", () => {
    if (player.isGrounded() && Math.abs(player.lastMotionVector.x) > Number.EPSILON) {
        player.play("walking", { preventRestart: true });
        player.animSpeed = Math.abs(player.lastMotionVector.x);
    }
    else {
        player.play("idle", { preventRestart: true });
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
    player.animSpeed = player.lastMotionVector.len();
});
player.onStateEnd("climbing", () => {
    player.gravityScale = 1;
    player.damping = 0;
    player.animSpeed = 1;
    player.mass = 1;
});

// Footsteps sound effects when walking
(player.onUpdate(() => {
    var xy = player.lastMotionVector;
    if (player.state == "normal") {
        if (xy.x === 0)
            xy = xy.reject(K.getGravityDirection());
        if (!player.isGrounded()) return;
    }
    if (player.state === "climbing" || player.state === "normal")
        player.footstepsCounter += K.dt() * xy.len();
    if (player.footstepsCounter >= FOOTSTEP_INTERVAL) {
        player.footstepsCounter = 0;
        player.playSound(player.state === "normal" ? (player.curPlatform()?.sprite === "grating" ? "footsteps_metal" : "footsteps") : "climbing");
        if (player.isGrounded())
            splash(player.pos.add(0, player.height / 2), K.WHITE.darken(70), 2, -10);
    }
}) as KEventControllerPatch).forEventGroup("!dialog");
