import * as BlueScreen from "../BlueScreen";
import { K } from "../../src/context";
import * as InputManager from "../controls/InputManager";
import { Settings } from "../settings";
import * as FPSMonitor from "../static/fpsMonitor";
import { SYSTEM_MENUS, SYSTEM_SETTINGS } from "../static/systemMenus";
import { installTabNavigation } from "../ui/tabNav";
import { buildMenu } from "./menus/buildMenu";
import { Menu } from "./menus/types";
import { Scene } from "./SceneManager";


export function menuScene(menu: Menu | undefined, set: Record<string, Menu> = SYSTEM_MENUS, settings: Settings = SYSTEM_SETTINGS) {
    BlueScreen.install();
    FPSMonitor.install();
    K.setBackground(K.BLACK);
    K.setGlobalLight({ intensity: 1, color: K.WHITE });
    if (K._k.game.sceneStack.length === 0) {
        throw new Error("cannot menu with nowhere to return to");
    }
    if (menu === undefined) {
        menu = K._k.game.sceneStack.at(-1)!.sceneID === Scene.TITLE_SCREEN ? SYSTEM_MENUS.settings! : SYSTEM_MENUS.paused!;
    }
    const scroller = buildMenu(menu, set, settings);
    scroller.onUpdate(() => {
        const ss = InputManager.getMotionInput("gui_scroll", null).y;
        scroller.scrollSpeed(ss * 500);
    });
    installTabNavigation(true);
}
