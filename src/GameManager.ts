import * as AssetLoader from "./AssetLoader";
import { K } from "./context";
import * as InputManager from "./controls/InputManager";
import { DataPackData } from "./DataPackFormat";
import * as LoadingManager from "./LoadingManager";
import * as BlueScreen from "./BlueScreen";
import inputsPNG from "./static/system_assets/inputs.png";
import inputsYAML from "./static/system_assets/inputs.yaml";

enum SceneName {
    MAIN_MENU = "mainMenu",
    SOME_ROOM = "room",
}


export function loadSystemStuff() {
    K.loadSpriteAtlas(inputsPNG, inputsYAML);
    InputManager.loadFonts();
}
export function setupScenes() {
    // K.scene(SceneName.MAIN_MENU, frontMenu);
    // K.scene(SceneName.SOME_ROOM, enterRoom);
}
export function downloadDatapack() {
    LoadingManager.loadJSON("build/aelith.json", (pack: DataPackData) => {
        for (var asset of pack.assets) {
            AssetLoader.loadAsset(asset);
        }
    });
}
export function main() {
    BlueScreen.install();
    LoadingManager.installLoadingScreen();
    loadSystemStuff();
    InputManager.setupControls();
    setupScenes();
    downloadDatapack();
    K.onLoad(() => K.go(SceneName.MAIN_MENU));
}
