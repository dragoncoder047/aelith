import * as RoomManager from "../room/RoomManager";
import * as BlueScreen from "../BlueScreen";

export function roomScene(whichRoom: string) {
    BlueScreen.install();
    RoomManager.enterRoom(whichRoom);
}
