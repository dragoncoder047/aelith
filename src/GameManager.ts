import { ZZFX } from "zzfx";
import * as AssetLoader from "./AssetLoader";
import * as BlueScreen from "./BlueScreen";
import { K } from "./context";
import * as InputManager from "./controls/InputManager";
import { DataPackData } from "./DataPackFormat";
import * as DownloadManager from "./DownloadManager";
import * as EntityManager from "./entity/EntityManager";
import * as PlatformGuesser from "./PlatformGuesser";
import * as RoomManager from "./room/RoomManager";
import * as SceneManager from "./scenes/SceneManager";
import * as StateManager from "./state/StateManager";
import inputsDEF from "./static/system_assets/inputButtons";
import inputsPNG from "./static/system_assets/inputs.png";
import kaplayPNG from "./static/system_assets/kaplay-logo.png";


export function setup() {
    BlueScreen.install();
    DownloadManager.installLoadingScreen();
    // where do I put this?
    ZZFX.sampleRate = 48000; // 48kHz seems to be more common now than 44.1kHz so let's use that
    K.loadSpriteAtlas(inputsPNG, inputsDEF);
    K.loadSprite("kaplay", kaplayPNG);
    K.loadHappy();
    InputManager.loadAssets();
    InputManager.setupControls();
    SceneManager.setupScenes();
    // where do I put THIS?
    K.strings.os = PlatformGuesser.guessOS();
    K.strings.switch = (switchData) => {
        const bits = switchData.split("~"), key = bits[0];
        const procCases = {} as Record<string, string>;
        for (var i = 1; i < bits.length; i++) {
            const pair = bits[i]!.split(":");
            procCases[pair[0]!] = pair[1]!;
        }
        return String(procCases[key!]);
    }
}
var pack: DataPackData;
export function getTitleData() {
    return pack.title;
}
export async function datapack() {
    pack = await DownloadManager.loadJSON("build/aelith.json") as any;
    console.log(pack);
    DownloadManager.doneWithInitialJSON();
    EntityManager.setEntityLibrary(pack.entityTypes);
    RoomManager.registerTilesets(pack.tilesets);
    if (pack.renderLayers) K.setLayers(pack.renderLayers[0], pack.renderLayers[1]);
    await Promise.all(pack.assets.map(AssetLoader.loadAsset));
    StateManager.setupInitialState(pack.initial);
}

export function main() {
    setup();
    K.load(datapack());
    K.onLoad(() => {
        K.go(SceneManager.Scene.TITLE_SCREEN);
    });
}

export function getDefaultValue<T extends keyof DataPackData["defaults"]>(valueName: T): DataPackData["defaults"][T] {
    return pack.defaults[valueName];
}
