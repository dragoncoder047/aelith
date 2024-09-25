import { WALK_SPEED, SCALE, MAX_THROW_VEL, MAX_THROW_STRETCH } from "./constants";
import { K } from "./init";

import { cursor } from './cursor';
import { player } from "./player";

// Controls
export function shouldMoveDown() {
    return K.isButtonDown("move_down") || K.getGamepadStick("left").y < 0;
}
export function shouldMoveUp() {
    return K.isButtonDown("move_up") || K.getGamepadStick("left").y > 0;
}
export function shouldMoveLeft() {
    return K.isButtonDown("move_left") || K.getGamepadStick("left").x < 0;
}
export function shouldMoveRight() {
    return K.isButtonDown("move_right") || K.getGamepadStick("left").x > 0;
}
player.onButtonDown("move_left", () => {
    player.move(-WALK_SPEED, 0);
    player.flipX = false;
});
player.onButtonDown("move_right", () => {
    player.move(WALK_SPEED, 0);
    player.flipX = true;
});
player.onButtonDown("move_up", () => {
    if (player.state === "climbing") player.move(0, -WALK_SPEED);
});
player.onButtonDown("move_down", () => {
    if (player.state === "climbing") player.move(0, WALK_SPEED);
});
player.onGamepadStick("left", xy => {
    if (player.state !== "climbing")
        xy.y = 0;
    player.move(xy.x * WALK_SPEED, xy.y * WALK_SPEED);
    if (xy.x > 0)
        player.flipX = true;
    else if (xy.x < 0)
        player.flipX = false;
});
player.onButtonPress("jump", () => {
    if (player.isGrounded() || player.state === "climbing") {
        player.jump();
        player.enterState("jump");
        if (!player.intersectingAny("button"))
            K.play("jump");
    }
});
player.onButtonPress("climb", () => {
    if (player.state === "climbing") {
        player.enterState("normal");
    }
    else if (player.intersectingAny("ladder")) {
        player.enterState("climbing");
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
