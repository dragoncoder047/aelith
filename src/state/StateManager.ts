import { Savefile } from "../DataPackFormat";
import * as TilemapManager from "../tilemap/TilemapManager";

export function setupInitialState(state: Savefile) {
    for (var r of Object.keys(state.rooms)) {
        TilemapManager.registerRoom(r, state.rooms[r]!);
    }
}
