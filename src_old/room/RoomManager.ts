import { K } from "../../src/context";
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
export function createRoom(name: string, data: RoomData) {
    (allRooms[name] = new Room(name, data)).spawnInitialEntities();
}

var currentRoomName: string | null = null;
export function enterRoom(roomName: string) {
    allRooms[roomName]!.load();
    currentRoomName = roomName;
    K.onSceneLeave(() => currentRoomName = null);
}

export function getCurrentRoom(): Room | null {
    return allRooms[currentRoomName!] ?? null;
}

export function getRoomByNameStrict(name: string): Room {
    const room = allRooms[name];
    if (!room) throw new Error(`no such room ${room}`);
    return room;
}
