import { ZZFX } from "zzfx";
import * as AssetLoader from "./AssetLoader";
import * as BlueScreen from "./BlueScreen";
import { K } from "./context";
import * as InputManager from "./controls/InputManager";
import { DataPackData } from "./DataPackFormat";
import * as DownloadManager from "./DownloadManager";
import * as SceneManager from "./scenes/SceneManager";
import * as ScriptHandler from "./script/ScriptHandler";
import inputsPNG from "./static/system_assets/inputs.png";
import kaplayPNG from "./static/system_assets/kaplay-logo.png";
import inputsYAML from "./static/system_assets/inputs.yaml";


export function setup() {
    BlueScreen.install();
    DownloadManager.installLoadingScreen();
    // where do I put this?
    ZZFX.sampleRate = 48000; // 48kHz seems to be more common now than 44.1kHz so let's use that
    K.loadSpriteAtlas(inputsPNG, inputsYAML);
    K.loadSprite("kaplay", kaplayPNG);
    K.loadHappy();
    InputManager.loadAssets();
    InputManager.setupControls();
    SceneManager.setupScenes();
}
export function downloadDatapack() {
    DownloadManager.loadJSON("build/aelith.json", (pack: DataPackData) => {
        if (pack.background) K.setBackground(K.rgb(pack.background));
        for (var asset of pack.assets) {
            AssetLoader.loadAsset(asset);
            if (asset.kind === "translation") this_should_not_be_defined();
        }
    });
}
export function main() {
    setup();
    downloadDatapack();
    K.onLoad(() => {
        // XXX: TEST
        K.onKeyPress(() => K.go(SceneManager.Scene.SPLASH_SCREEN));
        ScriptHandler.spawnTask(10, ["say", "hello"], null as any, {});
        ScriptHandler.advanceAsFarAsPossible();
    });
}
