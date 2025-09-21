import { RoomData, TilesetData } from "../DataPackFormat";
import { Room } from "./Room";


var allTilesets: Record<string, TilesetData> = {};
export function registerTilesets(tilesets: Record<string, TilesetData>) {
    allTilesets = tilesets;
}

export function getTileset(name: string): TilesetData {
    const t = allTilesets[name];
    if (!t) throw new Error(`undefined tileset ${name}`);
    return t;
}

var allRooms: Record<string, Room> = {};
export function registerRoom(name: string, data: RoomData) {
    allRooms[name] = new Room(name, data);
}

export function roomLoaded(roomName: string) {
    allRooms[roomName]!.load();
}
