import { AreaComp, GameObj, Tag, Vec2 } from "kaplay";
import { RoomData } from "../DataPackFormat";
import { Serializable } from "../Serializable";
import { Primitive } from "../draw/primitive";
import * as TilemapManager from "./TilemapManager";


type TileEntry = {
    pos: Vec2,
    primitive: Primitive
};
type ColliderEntry = {
    pos: Vec2,
    size: Vec2,
    tags: Tag[]
};

export class Room implements Serializable {
    layerItems: GameObj<unknown>[] = [];
    frozen: {
        colliders: ColliderEntry[],
        tiles: TileEntry[]
    } = { colliders: [], tiles: [] };
    constructor(
        public id: string,
        public data: RoomData,
    ) {
        buildFrozen(this);
    }
    toJSON(): RoomData {
        throw "tdo";
        return {} as any;
    }
    /** called when the room is entered */
    load() {

    }
    /** called when the room is unloaded (it should forget its gameObj's) */
    unload() {
        this.layerItems = [];
    }
    drawPseudo3D() {

    }
}

// find the tiles
function buildFrozen(room: Room) {
    // create tiles
    const tiles: TileEntry[] = [];
    const tileset = TilemapManager.getTileset(room.data.tileset);
    const sizes
}