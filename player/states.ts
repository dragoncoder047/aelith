import { player } from ".";
import { K } from "../init";
import { getMotionVector } from "./controls/impl";

// State functions
player.onStateUpdate("normal", () => {
    if (player.isGrounded() && Math.abs(getMotionVector().x) > Number.EPSILON) {
        if (player.getCurAnim()?.name != "walking") player.play("walking");
        player.animSpeed = getMotionVector().len();
    }
    else {
        if (player.getCurAnim()?.name != "idle") player.play("idle");
        player.animSpeed = 1;
    }
});
player.onStateEnter("jump", () => {
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
