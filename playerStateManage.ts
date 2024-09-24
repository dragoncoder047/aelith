import { shouldMoveLeft, shouldMoveRight, shouldMoveUp, shouldMoveDown } from "./controlsImpl";
import K from "./init";
import { player } from "./player";

// State functions
player.onStateUpdate("normal", () => {
    if (player.isGrounded() && (shouldMoveLeft() || shouldMoveRight())) {
        if (player.getCurAnim()?.name != "walking") player.play("walking");
    }
    else {
        if (player.getCurAnim()?.name != "idle") player.play("idle");
    }
});
player.onStateEnter("jump", () => {
    player.play("jump", { onEnd() { player.enterState("normal"); } });
});
player.onStateEnter("climbing", () => {
    player.gravityScale = 0;
    player.drag = 1;
    player.mass = Number.MAX_VALUE;
    player.vel = K.vec2(0);
    player.play("climbing");
    player.flipX = false;
    player.grabbing = undefined; // Drop whatever is being grabbed
});
player.onStateUpdate("climbing", () => {
    if (!player.intersectingAny("ladder")) {
        player.enterState("normal");
    } else if (shouldMoveUp()) {
        player.animSpeed = 1;
    } else if (shouldMoveDown()) {
        player.animSpeed = /*-*/ 1;
    } else if (shouldMoveLeft() || shouldMoveRight()) {
        player.animSpeed = 1;
    } else {
        player.animSpeed = 0;
    }
});
player.onStateEnd("climbing", () => {
    player.gravityScale = 1;
    player.drag = 0;
    player.animSpeed = 1;
    player.mass = 1;
});
