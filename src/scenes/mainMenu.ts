import * as BlueScreen from "../BlueScreen";
import { K } from "../context";

export function mainMenuScene() {
    BlueScreen.install();
    K.add([
        K.sprite("gameLogo"),
    ]);
    K.add([
        K.pos(K.center()),
        K.anchor("center"),
        K.text("stuff here lol", { size: 16 }),
    ]);
}
