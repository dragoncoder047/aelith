import { ZZFX } from "zzfx";
import * as AssetLoader from "./AssetLoader";
import * as BlueScreen from "./BlueScreen";
import { K } from "./context";
import * as InputManager from "./controls/InputManager";
import { DataPackData } from "./DataPackFormat";
import * as DownloadManager from "./DownloadManager";
import * as SceneManager from "./scenes/SceneManager";
import * as ScriptHandler from "./script/ScriptHandler";
import * as EntityManager from "./entity/EntityManager";
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
export async function datapack() {
    const pack: DataPackData = await DownloadManager.loadJSON("build/aelith.json") as any;
    console.log(pack);
    if (pack.background) K.setBackground(K.rgb(pack.background));
    EntityManager.setEntityLibrary(pack.entityTypes);
    for (var asset of pack.assets) {
        await AssetLoader.loadAsset(asset);
    }
}
export function main() {
    setup();
    K.load(datapack());
    K.onLoad(() => {
        K.go(SceneManager.Scene.SPLASH_SCREEN);
        // XXX: TEST
        ScriptHandler.spawnTask(10, ["say", "hi"], null as any, {});
        ScriptHandler.advanceAsFarAsPossible();
    });
}
