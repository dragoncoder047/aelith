import { EmitterOpt } from "kaplay";
import * as BlueScreen from "../BlueScreen";
import { K } from "../context";
import { SYSTEM_MENUS, SYSTEM_SETTINGS } from "../static/systemMenus";
import { below, layoutAnchor, uiButton } from "../ui";
import { installTabNavigation } from "./menus/tabNav";
import * as SceneManager from "./SceneManager";


export function titleScreenScene() {
    BlueScreen.install();
    // Game logo
    const logo = K.add([
        K.sprite("gameLogo"),
        K.pos(),
        K.anchor("center"),
        K.rotate(0),
        K.scale(),
    ]);
    logo.onUpdate(() => {
        logo.pos = K.vec2(K.width() / 2, logo.height / 2 + K.wave(-70, -60, K.time()));
        logo.angle = K.wave(-1, 1, K.time() / 1.3 + 2);
        logo.scaleTo(K.wave(0.79, 0.82, K.time() / 1.2 + 4));
    });
    // Particles
    const emitterOpt: EmitterOpt = {
        rate: 20,
        direction: 90,
        spread: 160,
        position: K.vec2(0)
    };
    const particles = logo.add([
        K.pos(),
        K.particles({
            max: 2000,
            speed: [100, 150],
            lifeTime: [.5, 1],
            colors: [K.CYAN],
            opacities: [1, 0],
            scales: [2, 10],
            angle: [0, 0],
            acceleration: [K.vec2(0, 300), K.vec2(0, 500)],
            damping: [0, 10],
            texture: K._k.gfx.defTex,
            quads: [K.quad(0, 0, 1, 1)],
        }, emitterOpt),
    ]);
    particles.onUpdate(() => {
        particles.worldPos(K.vec2(particles.worldPos()!.x, 0));
        particles.pos.x = -150;
    });
    K.onUpdate(() => {
        emitterOpt.rate = K.lerp(20, 1500, Math.pow(K.getGamepadAnalogButton("rtrigger"), 2));
    });
    const w = K.width() / 3;
    const enterBtn = K.add(uiButton(w, 2, "&msg.menu.main.startGameBtn", "jump", () => {
        K.go(SceneManager.Scene.ROOM);
    }));
    const optionsBtn = K.add(uiButton(w, 2, "&msg.menu.main.optionsMenuBtn", "main_menu_options", () => {
        K.pushScene(SceneManager.Scene.MENU);
    }));
    enterBtn.use(layoutAnchor(K.center));
    optionsBtn.use(below(enterBtn, 10));
    installTabNavigation();
}
