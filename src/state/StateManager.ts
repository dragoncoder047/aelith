import { Savefile } from "../DataPackFormat";
import * as RoomManager from "../room/RoomManager";

export function setupInitialState(state: Savefile) {
    for (var r of Object.keys(state.rooms)) {
        RoomManager.createRoom(r, state.rooms[r]!);
    }
}
