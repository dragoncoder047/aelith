import * as BlueScreen from "../BlueScreen";
import { K } from "../context";
import { Settings } from "../settings";
import { buildMenu } from "./menus/buildMenu";
import { Menu } from "./menus/types";


// {{stub}}
export function menuScene(menu: Menu, set: Record<string, Menu>, settings: Settings) {
    BlueScreen.install();
    if (K._k.game.sceneStack.length === 0) {
        throw new Error("cannot menu with nowhere to return to");
    } else {
        console.log(K._k.game.sceneStack);
    }
    console.log(menu, set, settings);
    buildMenu(menu, set, settings);
}
