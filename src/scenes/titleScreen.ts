import * as BlueScreen from "../BlueScreen";
import { K } from "../context";
import { DisplayEntity } from "../entity/DisplayEntity";
import * as GameManager from "../GameManager";
import * as ScriptHandler from "../script/ScriptHandler";
import * as FPSMonitor from "../static/fpsMonitor";
import { SYSTEM_MENUS } from "../static/systemMenus";
import { below, layoutAnchor, uiButton } from "../ui";
import { maybeAutoFocus, installTabNavigation } from "../ui/tabNav";
import * as SceneManager from "./SceneManager";

var first = true;

export function titleScreenScene() {
    BlueScreen.install();
    FPSMonitor.install();
    K.setGlobalLight({ intensity: 1, color: K.WHITE });
    K.setBackground(K.BLACK);
    const e = new DisplayEntity(GameManager.getTitleData().entity, K.vec2(K.width() / 2, 0), {});
    ScriptHandler.startMainLoop();
    installTabNavigation();
    e.obj!.onUpdate(() => {
        e.setPosition(K.vec2(K.width() / 2, 0));
    });
    const w = K.width() / 3;
    const enterBtn = K.add(uiButton(w, 2, "&msg.menu.main.startGameBtn", "start_game", () => {
        K.play("nav_confirm");
        K.go(SceneManager.Scene.ROOM);
    }));
    const optionsBtn = K.add(uiButton(w, 2, "&msg.menu.main.optionsMenuBtn", "main_menu_options", () => {
        K.play("nav_open");
        K.pushScene(SceneManager.Scene.MENU, SYSTEM_MENUS.settings);
    }));
    const aboutBtn = K.add(uiButton(w, 2, "&msg.menu.main.aboutMenuBtn", null, () => {
        K.play("nav_open");
        K.pushScene(SceneManager.Scene.MENU, SYSTEM_MENUS.about);
    }));
    // TODO: add Newgrounds button
    enterBtn.use(layoutAnchor(K.center));
    optionsBtn.use(below(enterBtn, 10));
    aboutBtn.use(below(optionsBtn, 10));
    if (!first) maybeAutoFocus();
    first = false;
}
