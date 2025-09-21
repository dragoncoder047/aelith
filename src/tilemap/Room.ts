import { Tag, Vec2 } from "kaplay";
import { RenderData, RoomData, StaticTileDefinition } from "../DataPackFormat";
import { Serializable } from "../Serializable";
import { K } from "../context";
import { multiprimitive } from "../draw/multiprimitive";
import { hashPoint } from "../utils";
import * as TilemapManager from "./TilemapManager";
import { autotile } from "./autotile";
import { mergeColliders } from "./merge";


export type TileEntry = {
    pos: Vec2,
    r: RenderData,
    depth: number | undefined;
    auto: StaticTileDefinition["autotile"];
    tags: Tag[];
};
export type ColliderEntry = {
    i: number;
    pos: Vec2,
    def: StaticTileDefinition["physics"],
    tags: Tag[];
}

export class Room implements Serializable {
    frozen: {
        colliders: ColliderEntry[],
        tiles: TileEntry[]
    } = { colliders: [], tiles: [] };
    constructor(
        public id: string,
        public data: RoomData,
    ) {
        // TODO: create entities
        // TODO: create navigation map (also need rules in tile map)
        this.frozen = buildFrozen(data);
    }
    toJSON(): RoomData {
        throw "tdo";
        return {} as any;
    }
    /** called when the room is entered */
    load() {
        K.onSceneLeave(() => {
            this.unload();
        });
        for (var coll of this.frozen.colliders) {
            const [x, y, w, h] = coll.def.hitbox;
            const c = K.add([
                K.pos(coll.pos),
                K.area({
                    shape: new K.Rect(K.vec2(x, y), w, h),
                    collisionIgnore: coll.def.ignore
                }),
                K.body({ isStatic: true }),
                "tile",
                ...coll.tags
            ]);
            if (coll.def.rungs) {
                c.unuse("body");
                // TODO: ladder component
            } else if (coll.def.platform) {
                c.use(K.platformEffector());
            }
        }
        for (var tile of this.frozen.tiles) {
            const t = K.add([
                K.pos(tile.pos),
                multiprimitive(this.id + hashPoint(tile.pos), [tile.r]),
                K.offscreen({ hide: true }),
            ]);
            if (tile.r.layer) t.use(K.layer(tile.r.layer));
        }
    }
    /** called when the room is unloaded (it should forget its gameObj's) */
    unload() {
    }
    drawPseudo3D() {

    }
}

function buildFrozen(data: RoomData): Room["frozen"] {
    const colliders: ColliderEntry[][][] = [];
    const tiles: TileEntry[][][] = [];
    const entityOrDoorSlots: Record<string, Vec2> = {};
    const indexMap = data.indexMapping;
    const { gridSize: sz, tiles: tileDefs } = TilemapManager.getTileset(data.tileset);
    const grid = data.map;
    for (var r = 0; r < grid.length; r++) {
        const row = grid[r]!;
        const cRow: ColliderEntry[][] = [];
        const tRow: TileEntry[][] = [];
        colliders.push(cRow);
        tiles.push(tRow);
        for (var c = 0; c < row.length; c++) {
            var indexes = indexMap[row[c]!];
            const pos = K.vec2(c * sz, r * sz);
            const cEntry: ColliderEntry[] = [];
            const tEntry: TileEntry[] = [];
            tRow.push(tEntry);
            cRow.push(cEntry);
            if (indexes === undefined) continue;
            if (!(Array.isArray(indexes))) indexes = [indexes];
            for (var index of indexes) {
                if (typeof index === "string") entityOrDoorSlots[index] = pos;
                else {
                    const desc = tileDefs[index];
                    if (desc?.r !== undefined) {
                        tEntry.push({ pos, r: desc.r, depth: desc.depth, auto: desc.autotile, tags: desc.tags });
                    }
                    if (desc?.physics !== undefined) {
                        cEntry.push({ i: index, pos, def: desc.physics, tags: desc.tags });
                    }
                }
            }
        }
    }
    return { colliders: mergeColliders(colliders, sz), tiles: autotile(tiles) };
}
