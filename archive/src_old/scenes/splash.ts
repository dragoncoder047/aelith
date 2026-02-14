import { K } from "../../src/context";
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
    const opt = { duration: 2, loops: 1 };
    thing.animate("scale", [K.vec2(.9, .9), K.vec2(1.1, 1.1)], opt);
    img.animate("opacity", [0, 0.5, 1, 0], opt);
    text.animate("opacity", [0, 0.5, 1, 0], opt);
    K.wait(2, () => K.go(Scene.TITLE_SCREEN));
}
