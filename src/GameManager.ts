import { ZZFX } from "zzfx";
import * as AssetLoader from "./AssetLoader";
import * as BlueScreen from "./BlueScreen";
import { K } from "./context";
import * as InputManager from "./controls/InputManager";
import { DataPackData } from "./DataPackFormat";
import * as DownloadManager from "./DownloadManager";
import { SCALE } from "./static/constants";
import inputsPNG from "./static/system_assets/inputs.png";
import inputsYAML from "./static/system_assets/inputs.yaml";
import * as TextStyles from "./TextStyles";

enum SceneName {
    MAIN_MENU = "mainMenu",
    SOME_ROOM = "room",
}


export function loadSystemStuff() {
    // where do I put this?
    ZZFX.sampleRate = 48000; // 48kHz seems to be more common now than 44.1kHz so let's use that
    K.loadSpriteAtlas(inputsPNG, inputsYAML);
    InputManager.loadAssets();
}
export function setupScenes() {
    // K.scene(SceneName.MAIN_MENU, frontMenu);
    // K.scene(SceneName.SOME_ROOM, enterRoom);
}
export function downloadDatapack() {
    DownloadManager.loadJSON("build/aelith.json", (pack: DataPackData) => {
        for (var asset of pack.assets) {
            AssetLoader.loadAsset(asset);
        }
        // XXX: TEST
        K.add([K.text("", { styles: TextStyles.STYLES, size: 16 / SCALE }), K.dynamicText("$pr_btn(scroll_inventory)")]);
    });
}
export function main() {
    BlueScreen.install();
    DownloadManager.installLoadingScreen();
    loadSystemStuff();
    InputManager.setupControls();
    setupScenes();
    downloadDatapack();
    // K.onLoad(() => K.go(SceneName.MAIN_MENU));
}
