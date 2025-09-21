import * as TilemapManager from "../tilemap/TilemapManager";
import * as BlueScreen from "../BlueScreen";

export function roomScene(whichRoom: string) {
    BlueScreen.install();
    TilemapManager.roomLoaded(whichRoom);
}
