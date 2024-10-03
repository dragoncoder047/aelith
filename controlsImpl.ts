import { WALK_SPEED, SCALE, MAX_THROW_VEL, MAX_THROW_STRETCH } from "./constants";
import { K } from "./init";

import { cursor } from "./cursor";
import { player } from "./player";
import { Vec2 } from "kaplay";

// Controls

export function getMotionVector(): Vec2 {
    return K.vec2(
        +K.isButtonDown("move_right") - +K.isButtonDown("move_left"),
        +K.isButtonDown("move_down") - +K.isButtonDown("move_up"), // y increases downward
    ).add(K.getGamepadStick("left"));
}

function motionHandler() {
    const xy = getMotionVector();
    if (player.state === "normal" && player.isGrounded())
        xy.y = 0;
    player.move(xy.scale(WALK_SPEED));
    if (xy.x > 0)
        player.flipX = true;
    else if (xy.x < 0)
        player.flipX = false;
}

player.onButtonDown(["move_left", "move_right", "move_up", "move_down"], motionHandler);
player.onGamepadStick("left", motionHandler);
player.onButtonPress("jump", () => {
    if (player.isGrounded() || player.state === "climbing") {
        player.jump();
        player.enterState("jump");
        if (!player.intersectingAny("button"))
            K.play("jump");
    }
});
player.onButtonPress("climb", () => {
    if (player.intersectingAny("ladder")) {
        player.enterState("climbing");
    }
});
player.onButtonRelease("climb", () => {
    if (player.state === "climbing") {
        player.enterState("normal");
    }
});
player.onButtonPress("throw", () => {
    const thrown = player.grabbing;
    if (!thrown) return;
    var direction = cursor.screenPos()!.sub(player.screenPos()!).scale(SCALE * MAX_THROW_VEL / MAX_THROW_STRETCH);
    const len = direction.len();
    if (len > MAX_THROW_VEL) direction = direction.scale(MAX_THROW_VEL / len);
    player.grabbing = undefined;
    thrown.applyImpulse(direction);
});
