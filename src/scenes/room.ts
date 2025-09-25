import * as RoomManager from "../room/RoomManager";
import * as BlueScreen from "../BlueScreen";
import * as ScriptHandler from "../script/ScriptHandler";
import { K } from "../context";

export function roomScene(whichRoom: string) {
    BlueScreen.install();
    RoomManager.enterRoom(whichRoom);
    K.onUpdate(() => {
        ScriptHandler.advanceAsFarAsPossible();
    });
}
