import { K } from "../context";
import { Scene } from "./SceneManager";

export function splashScreenScene() {
    const thing = K.add([
        K.pos(K.center()),
        K.scale(),
        K.animate(),
    ]);
    const img = thing.add([
        K.sprite("kaplay", { width: K.width() * 2 / 3 }),
        K.anchor("center"),
        K.opacity(0),
        K.animate(),
    ]);
    const text = thing.add([
        K.text("made with", { font: "happy", size: K.width() / 20, align: "center" }),
        K.pos(0, -K.height() / 4),
        K.anchor("bot"),
        K.opacity(0),
        K.animate(),
    ]);
    thing.animate("scale", [K.vec2(.9, .9), K.vec2(1.1, 1.1)], { duration: 2, loops: 1 });
    img.animate("opacity", [0, 1, 0], { duration: 2, loops: 1 });
    text.animate("opacity", [0, 1, 0], { duration: 2, loops: 1 });
    K.wait(2.5, () => K.go(Scene.MAIN_MENU));
}
