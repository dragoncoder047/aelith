import * as BlueScreen from "../BlueScreen";
import { K } from "../context";
import * as EntityManager from "../entity/EntityManager";
import * as RoomManager from "../room/RoomManager";
import * as SceneManager from "../scenes/SceneManager";
import * as ScriptHandler from "../script/ScriptHandler";

export function roomScene(whichRoom: string | undefined) {
    BlueScreen.install();
    const p = EntityManager.getPlayer()!;
    if (whichRoom === undefined) {
        whichRoom = p.currentRoom!;
    }
    EntityManager.installControlsHandler();
    RoomManager.enterRoom(whichRoom);
    K.setCamPos(p.pos);
    K.setCamScale(p.getPrototype().behavior.camScale ?? 1);
    const u = K.onUpdate(async () => {
        u.paused = true;
        await ScriptHandler.advanceAsFarAsPossible();
        u.paused = false;
    });
    K.scene.onButtonPress("pause_unpause", () => {
        K.pushScene(SceneManager.Scene.MENU);
    });
}
