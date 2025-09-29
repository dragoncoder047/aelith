import * as RoomManager from "../room/RoomManager";
import * as BlueScreen from "../BlueScreen";
import * as ScriptHandler from "../script/ScriptHandler";
import { K } from "../context";

export function roomScene(whichRoom: string) {
    BlueScreen.install();
    RoomManager.enterRoom(whichRoom);
    const u = K.onUpdate(async () => {
        u.paused = true;
        await ScriptHandler.advanceAsFarAsPossible();
        u.paused = false;
    });
}
