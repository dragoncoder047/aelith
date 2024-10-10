import { cursor } from "./cursor";
import { K } from "./init";
import { player } from "./player";

// right stick moves cursor
K.setCursor("none");
cursor.onGamepadStick("right", xy => {
    cursor.move(xy);
    cursor.update();
});
K.onMouseMove(() => {
    cursor.update();
    if (K.mousePos().x < player.screenPos()!.x) player.flipX = false;
    else player.flipX = true;
});
K.onButtonPress("interact", () => cursor.press());
K.onButtonRelease("interact", () => cursor.release());
