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
    if (cursor.screenPos()!.x < player.screenPos()!.x) player.flipX = false;
    else player.flipX = true;
});
K.onButtonPress("click", () => cursor.press());
K.onButtonRelease("click", () => cursor.release());
