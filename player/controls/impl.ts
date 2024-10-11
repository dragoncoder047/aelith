import { AreaComp, Vec2 } from "kaplay";
import { player } from "..";
import { FOOTSTEP_INTERVAL, MAX_THROW_STRETCH, MAX_THROW_VEL, SCALE, WALK_SPEED } from "../../constants";
import { cursor } from "../../cursor";
import { K } from "../../init";

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
    var direction = player.lookingDirection.scale(SCALE * MAX_THROW_VEL / MAX_THROW_STRETCH);
    const len = direction.len();
    if (len > MAX_THROW_VEL) direction = direction.scale(MAX_THROW_VEL / len);
    player.drop(thrown);
    thrown.applyImpulse(direction);
    player.playSound("throw");
});

player.onButtonPress("interact", () => {
    if (K.get<AreaComp>("ui-button").some(x => x.isHovering())
        && K.getLastInputDeviceType() === "mouse")
        return;
    if (player.lookingAt !== undefined)
        player.lookingAt.trigger("interact");
});

// Mouse looking
player.onMouseMove(mousePos => {
    // toWorld is darn bugged kaplayjs/kaplay#325
    player.lookAt(K.toWorld(mousePos.scale(1 / SCALE)));
});
player.onGamepadStick("right", xy => {
    player.lookAt(xy.scale(MAX_THROW_STRETCH).add(player.headPosWorld));
});

// Inventory
player.onButtonPress("inv_previous", () => player.scrollInventory(-1));
player.onButtonPress("inv_next", () => player.scrollInventory(1));

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
