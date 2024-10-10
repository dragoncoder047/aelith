import { WALK_SPEED, SCALE, MAX_THROW_VEL, MAX_THROW_STRETCH, FOOTSTEP_INTERVAL } from "../../constants";
import { K } from "../../init";

import { cursor } from "../../cursor";
import { player } from "..";
import { Vec2 } from "kaplay";

// Controls

export function getMotionVector(): Vec2 {
    return K.vec2(
        +K.isButtonDown("move_right") - +K.isButtonDown("move_left"),
        +K.isButtonDown("move_down") - +K.isButtonDown("move_up"), // y increases downward
    ).add(K.getGamepadStick("left").reflect(K.RIGHT)); // y increases downward
}

function motionHandler() {
    const xy = getMotionVector();
    if (player.state === "normal")
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
            player.playSound("jump");
    }
});
player.onButtonDown("climb", () => {
    if (player.intersectingAny("ladder") && player.state !== "climbing") {
        player.enterState("climbing");
    }
});
player.onButtonRelease("climb", () => {
    if (player.state === "climbing") {
        player.enterState("normal");
    }
});
player.onButtonPress("throw", () => {
    const thrown = player.holdingItem;
    if (!thrown) return;
    var direction = cursor.screenPos()!.sub(player.screenPos()!).scale(SCALE * MAX_THROW_VEL / MAX_THROW_STRETCH);
    const len = direction.len();
    if (len > MAX_THROW_VEL) direction = direction.scale(MAX_THROW_VEL / len);
    player.drop(thrown);
    thrown.applyImpulse(direction);
    player.playSound("throw");
});

// Footsteps sound effects when walking
player.onUpdate(() => {
    var xy = getMotionVector();
    if (player.state == "normal") {
        if (xy.x === 0)
            xy = xy.reject(K.getGravityDirection());
        if (!player.isGrounded()) xy = xy.scale(0);
    }
    if (player.state === "climbing" || player.state === "normal")
        player.footstepsCounter += K.dt() * xy.len();
    if (player.footstepsCounter >= FOOTSTEP_INTERVAL) {
        player.footstepsCounter = 0;
        player.playSound(player.state === "normal" ? "footsteps" : "climbing");
    }
});
