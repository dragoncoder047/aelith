import * as BlueScreen from "../BlueScreen";
import { K } from "../context";
import { Settings } from "../settings";
import { SYSTEM_MENUS, SYSTEM_SETTINGS } from "../static/systemMenus";
import { buildMenu } from "./menus/buildMenu";
import { installTabNavigation } from "./menus/tabNav";
import { Menu } from "./menus/types";


// {{stub}}
export function menuScene(menu: Menu = SYSTEM_MENUS.main!, set: Record<string, Menu> = SYSTEM_MENUS, settings: Settings = SYSTEM_SETTINGS) {
    BlueScreen.install();
    if (K._k.game.sceneStack.length === 0) {
        throw new Error("cannot menu with nowhere to return to");
    } else {
        console.log(K._k.game.sceneStack);
    }
    buildMenu(menu, set, settings);
    installTabNavigation();
}
