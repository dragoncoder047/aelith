import { K } from "./context";
import { InputManager } from "./controls/InputManager";
import { DataPackData } from "./DataPackFormat";
import { LoadingManager } from "./LoadingManager";
import inputsPNG from "./static/system_assets/inputs.png";
import inputsYAML from "./static/system_assets/inputs.yaml";

enum SceneName {
    MAIN_MENU = "mainMenu",
    SOME_ROOM = "room",
}

export const GameManager = {
    loadStuff() {
        K.loadSpriteAtlas(inputsPNG, inputsYAML);
        InputManager.loadFonts();
    },
    setupScenes() {
        // K.scene(SceneName.MAIN_MENU, () => this.frontMenu());
        // K.scene(SceneName.SOME_ROOM, (roomName: string) => this.enterRoom(roomName));
    },
    downloadDatapack() {
        LoadingManager.loadJSON("build/aelith.json", (pack: DataPackData) => {
            console.log(pack);
        });
    },
    main() {
        LoadingManager.installLoadingScreen();
        this.loadStuff();
        InputManager.setupControls();
        this.setupScenes();
        this.downloadDatapack();
        K.onLoad(() => K.go(SceneName.MAIN_MENU));
    }
};
