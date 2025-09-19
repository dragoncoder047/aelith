import { TilesetData } from "../DataPackFormat";


var allTilesets: Record<string, TilesetData> = {};
export function registerTilesets(tilesets: Record<string, TilesetData>) {
    allTilesets = tilesets;
}

export function getTileset(name: string): TilesetData {
    const t = allTilesets[name];
    if (!t) throw new Error(`undefined tileset ${name}`);
    return t;
}
