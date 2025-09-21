import * as BlueScreen from "../BlueScreen";
import { K } from "../context";
import { Scene } from "./SceneManager";

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
    K.wait(1, () => K.go(Scene.ROOM, "test"));
}
