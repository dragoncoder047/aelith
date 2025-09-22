import { GameObj, Tag, Vec2 } from "kaplay";
import { RenderData, RoomData, StaticTileDefinition } from "../DataPackFormat";
import { Serializable } from "../Serializable";
import { K } from "../context";
import { hashPoint, javaHash } from "../utils";
import * as TilemapManager from "./TilemapManager";
import { autotile } from "./autotile";
import { mergeColliders } from "./merge";
import { addRenderComps } from "../draw/primitive";


export type TileEntry = {
    pos: Vec2,
    r: RenderData,
    ds: number | number[] | undefined;
    auto: StaticTileDefinition["autotile"];
    tag: Tag;
};
export type ColliderEntry = {
    i: number;
    pos: Vec2,
    def: StaticTileDefinition["physics"],
    tag: Tag;
}

const DEPTH = 0.1;
const COLOR_FACTOR = 2;
const OPACITY_FACTOR = 7;

export class Room implements Serializable {
    b: string | undefined;
    f: {
        c: ColliderEntry[],
        t: TileEntry[]
    } = { c: [], t: [] };
    st: [GameObj, number][] = [];
    dc: WeakMap<GameObj, number> = new WeakMap;
    constructor(
        public id: string,
        public data: RoomData,
    ) {
        // TODO: create entities
        // TODO: create navigation map (also need rules in tile map)
        this.f = buildFrozen(data);
        this.b = TilemapManager.getTileset(data.tileset).background;
    }
    toJSON(): RoomData {
        throw "todo";
        return {} as any;
    }
    /** load - called when the room is entered */
    l() {
        const self = this;
        K.onSceneLeave(() => {
            this.u();
        });
        for (var coll of this.f.c) {
            const [x, y, w, h] = coll.def.hitbox;
            const c = K.add([
                K.pos(coll.pos),
                K.area({
                    shape: new K.Rect(K.vec2(x, y), w, h),
                    collisionIgnore: coll.def.ignore
                }),
                K.body({ isStatic: true }),
                "tile",
                coll.tag,
            ]);
            if (coll.def.rungs) {
                c.unuse("body");
                // TODO: ladder component
            } else if (coll.def.platform) {
                c.use(K.platformEffector());
            }
        }
        if (this.f.t.some(t => t.ds)) {
            K.add([
                K.layer("background"),
                {
                    draw() {
                        self.d();
                    }
                }
            ]);
        }
        for (var tile of this.f.t) {
            if (!tile.r) continue;
            const t = K.add([
                K.pos(tile.pos),
                K.offscreen({ hide: true }),
            ]);
            addRenderComps(t, javaHash(this.id + hashPoint(tile.pos)), tile.r);
            if (tile.r.layer) t.use(K.layer(tile.r.layer));
            if (tile.ds) this.st.push([t, tile.ds as number]);
        }
        K.setBackground(this.b ? K.rgb(this.b) : K.BLACK);
    }
    /** unload - called when the room is unloaded (it should forget its gameObj's) */
    u() {
        this.st = [];
    }
    /** draw depth (pseudo 3d) */
    d() {
        // XXX: TEST REMOVE ME
        K.setCamPos(K.wave(K.vec2(150, 0), K.vec2(300), K.time()));
        var t: number, i = 0;
        // set up counters
        for (i = 0; i < this.st.length; i++) {
            const [obj, depthSteps] = this.st[i]!;
            t = 0;
            obj.opacity ??= 1;
            obj.color ??= K.WHITE.clone();
            while (t < DEPTH) t += DEPTH / depthSteps;
            this.dc.set(obj, t);
        }
        t = DEPTH;
        const vanishingPoint = K.getCamPos();
        vanishingPoint.y -= K.height() / 3;
        const worldPos = K.vec2();
        const tVec = K.vec2();
        const sVec = K.vec2();
        while (t > 0) {
            var minStep = Number.MAX_VALUE;
            const opacityFac = t * OPACITY_FACTOR;
            const colorFac = 1 - t * COLOR_FACTOR;
            const scale = 1 - t;
            for (i = 0; i < this.st.length; i++) {
                const [obj, ds] = this.st[i]!;
                const step = DEPTH / ds;
                const nextT = this.dc.get(obj)!;
                minStep = Math.min(minStep, step);
                if (t <= nextT) {
                    const t2 = t - step;
                    this.dc.set(obj, t2);

                    // non-allocating version of worldPos()
                    obj.parent!.transform.transformPointV(obj.pos, worldPos);
                    const x = K.lerp(worldPos.x, vanishingPoint.x, t);
                    const y = K.lerp(worldPos.y, vanishingPoint.y, t);
                    tVec.set(x, y);
                    sVec.set(scale, scale);
                    K.pushTranslate(tVec);
                    K.pushScale(sVec);

                    obj.color.r *= colorFac;
                    obj.color.g *= colorFac;
                    obj.color.b *= colorFac;
                    obj.opacity -= opacityFac;

                    // .draw() resets the transform so don't call it
                    obj._drawEvents.trigger();

                    obj.color.r /= colorFac;
                    obj.color.g /= colorFac;
                    obj.color.b /= colorFac;
                    obj.opacity += opacityFac;

                    sVec.set(1 / scale, 1 / scale);
                    K.pushScale(sVec);
                    tVec.set(-x, -y);
                    K.pushTranslate(tVec);
                }
            }
            t -= minStep;
        }
    }
}

function buildFrozen(data: RoomData): Room["f"] {
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
                    if (desc?.render !== undefined) {
                        tEntry.push({ pos, r: desc.render, ds: desc.depth, auto: desc.autotile, tag: desc.tag });
                    }
                    if (desc?.physics !== undefined) {
                        cEntry.push({ i: index, pos, def: desc.physics, tag: desc.tag });
                    }
                }
            }
        }
    }
    return { c: mergeColliders(colliders, sz), t: autotile(tiles) };
}
