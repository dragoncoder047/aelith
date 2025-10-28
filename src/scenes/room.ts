import * as BlueScreen from "../BlueScreen";
import { K } from "../context";
import * as EntityManager from "../entity/EntityManager";
import * as RoomManager from "../room/RoomManager";
import * as ScriptHandler from "../script/ScriptHandler";
import * as InputManager from "../controls/InputManager";

export function roomScene(whichRoom: string | undefined) {
    BlueScreen.install();
    if (whichRoom === undefined) {
        whichRoom = EntityManager.getPlayer()!.currentRoom!;
    }
    InputManager.installControlsHandler();
    RoomManager.enterRoom(whichRoom);
    const u = K.onUpdate(async () => {
        u.paused = true;
        await ScriptHandler.advanceAsFarAsPossible();
        u.paused = false;
    });
}
