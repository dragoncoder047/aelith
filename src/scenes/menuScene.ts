import * as BlueScreen from "../BlueScreen";
import { K } from "../context";
import { Settings } from "../settings";
import { SYSTEM_MENUS, SYSTEM_SETTINGS } from "../static/systemMenus";
import { buildMenu } from "./menus/buildMenu";
import { installTabNavigation } from "./menus/tabNav";
import { Menu } from "./menus/types";
import { Scene } from "./SceneManager";


// {{stub}}
export function menuScene(menu: Menu | undefined, set: Record<string, Menu> = SYSTEM_MENUS, settings: Settings = SYSTEM_SETTINGS) {
    BlueScreen.install();
    K.setBackground(K.BLACK);
    if (K._k.game.sceneStack.length === 0) {
        throw new Error("cannot menu with nowhere to return to");
    }
    if (menu === undefined) {
        menu = K._k.game.sceneStack.at(-1)!.sceneID === Scene.TITLE_SCREEN ? SYSTEM_MENUS.settings! : SYSTEM_MENUS.paused!;
    }
    buildMenu(menu, set, settings);
    installTabNavigation();
}
