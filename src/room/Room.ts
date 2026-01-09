import { Color, ColorComp, GameObj, PosComp, Tag, Vec2 } from "kaplay";
import { RenderData, RoomData, StaticTileDefinition } from "../DataPackFormat";
import * as GameManager from "../GameManager";
import { Serializable } from "../Serializable";
import { K } from "../context";
import { addRenderComps } from "../draw/primitive";
import * as EntityManager from "../entity/EntityManager";
import { hashPoint, javaHash } from "../hash";
import { addPhysicsComponents } from "../physics/addComponents";
import * as ScriptHandler from "../script/ScriptHandler";
import * as RoomManager from "./RoomManager";
import { autotile } from "./autotile";
import { mergeColliders } from "./merge";
import { BackgroundLayer } from "../context/plugins/kaplay-background-more";


export type TileEntry = {
    pos: Vec2,
    r: RenderData,
    ds: number | number[] | undefined;
    auto: StaticTileDefinition["autotile"];
    tags: Tag[];
};
export type ColliderEntry = {
    i: number;
    pos: Vec2,
    def: StaticTileDefinition["physics"],
    tags: Tag[];
}

const COLOR_FACTOR = 4;

export class Room implements Serializable {
    bg: string | BackgroundLayer[] | undefined;
    frozen: {
        colliders: ColliderEntry[],
        tiles: TileEntry[],
        slots: Record<string, Vec2>;
    };
    depthTiles: [GameObj<ColorComp | PosComp>, number][] = [];
    depthCache: WeakMap<GameObj, number> = new WeakMap;
    entitiesInHere: string[] = [];
    constructor(
        public id: string,
        public data: RoomData,
    ) {
        // TODO: create navigation map (also need rules in tile map)
        this.frozen = buildFrozen(data);
        this.bg = RoomManager.getTileset(data.tileset).background;
    }
    spawnInitialEntities() {
        for (var e of Object.keys(this.data.entities ?? {})) {
            EntityManager.spawnEntityInRoom(this.frozen.slots[e]!, this.id, this.data.entities![e]!);
        }
    }
    toJSON(): RoomData {
        throw "todo";
        return {} as any;
    }
    load() {
        const self = this;
        K.onSceneLeave(() => {
            this.unloaded();
        });
        EntityManager.loadAllEntitiesInRoom(this.id);
        for (var coll of this.frozen.colliders) {
            const [x, y, w, h] = coll.def.hitbox;
            const c = K.add([
                K.pos(coll.pos),
                K.area({
                    shape: new K.Rect(K.vec2(x, y), w, h),
                }),
                K.body({ isStatic: true }),
                "tile",
                ...coll.tags,
            ]);
            addPhysicsComponents(c, coll.def.comps ?? [], true);
        }
        if (this.frozen.tiles.some(t => t.ds)) {
            K.add([
                K.layer(GameManager.getDefaultValue("depthLayer")),
                {
                    draw() {
                        self.drawDepth();
                    }
                }
            ]);
        }
        for (var tile of this.frozen.tiles) {
            if (!tile.r) continue;
            const t = K.add([
                K.pos(tile.pos),
                K.offscreen({ hide: true }),
                K.color(K.WHITE),
            ]);
            addRenderComps(t, javaHash(self.id + hashPoint(tile.pos)), null, tile.r);
            if (!t.has("layer")) t.use(K.layer(GameManager.getDefaultValue("tileLayer")));
            if (tile.ds) this.depthTiles.push([t, tile.ds as number]);
        }
        K.setBackground(self.bg ?? GameManager.getDefaultValue("background") ?? "black");
        K.setGravity(self.data.gravity ?? GameManager.getDefaultValue("gravity") ?? 0);
        const setup1 = RoomManager.getTileset(self.data.tileset).initFunc;
        const setup2 = self.data.init;
        ScriptHandler.spawnTask(0, ["do", setup1, setup2], null, {});
    }
    unloaded() {
        this.depthTiles = [];
    }
    static _depthEnabled = true;
    drawDepth() {
        if (!Room._depthEnabled) return;
        var t: number, i = 0;
        const DEPTH = GameManager.getDefaultValue("depth") ?? 0.1;
        // set up counters
        for (i = 0; i < this.depthTiles.length; i++) {
            const d = this.depthTiles[i]!, obj = d[0], depthSteps = d[1];
            t = 0;
            while (t < DEPTH) t += DEPTH / depthSteps;
            this.depthCache.set(obj, t);
        }
        t = DEPTH;
        const vanishingPoint = K.getCamPos();
        vanishingPoint.y -= K.height() / 3;
        const worldPos = K.vec2();
        const tVec = K.vec2();
        const sVec = K.vec2();
        var oldR: number, oldG: number, oldB: number, color: Color;
        const bColor = K.getBackground()!;
        while (t > 0) {
            var minStep = Number.MAX_VALUE;
            const colorLerpValue = t * COLOR_FACTOR;
            const scale = 1 - t;
            for (i = 0; i < this.depthTiles.length; i++) {
                const d = this.depthTiles[i]!, obj = d[0], ds = d[1];
                if (obj.hidden) continue;
                // TODO: more filtering based on quadrant and tile's edges, don't draw it if it is obvious it will not add any pixels to draw it
                const step = DEPTH / ds;
                const nextT = this.depthCache.get(obj)!;
                minStep = Math.min(minStep, step);
                if (t <= nextT) {
                    const t2 = t - step;
                    this.depthCache.set(obj, t2);

                    // non-allocating version of worldPos()
                    obj.parent!.transform.transformPointV(obj.pos, worldPos);
                    const x = K.lerp(worldPos.x, vanishingPoint.x, t);
                    const y = K.lerp(worldPos.y, vanishingPoint.y, t);
                    tVec.set(x, y);
                    sVec.set(scale, scale);
                    K.pushTranslate(tVec);
                    K.pushScale(sVec);

                    color = obj.color;

                    oldR = color.r;
                    oldG = color.g;
                    oldB = color.b;

                    color.r = K.lerp(oldR, bColor.r, colorLerpValue);
                    color.g = K.lerp(oldG, bColor.g, colorLerpValue);
                    color.b = K.lerp(oldB, bColor.b, colorLerpValue);

                    // .draw() resets the transform so don't call it
                    (obj as any)._drawEvents.trigger();

                    color.r = oldR;
                    color.g = oldG;
                    color.b = oldB;

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

function buildFrozen(data: RoomData): Room["frozen"] {
    const colliders: ColliderEntry[][][] = [];
    const tiles: TileEntry[][][] = [];
    const entityOrDoorSlots: Record<string, Vec2> = {};
    const indexMap = data.indexMapping;
    const { gridSize: sz, tiles: tileDefs } = RoomManager.getTileset(data.tileset);
    const grid = data.map;
    for (var r = 0; r < grid.length; r++) {
        const row = grid[r]!;
        const cRow: ColliderEntry[][] = [];
        const tRow: TileEntry[][] = [];
        colliders.push(cRow);
        tiles.push(tRow);
        for (var c = 0; c < row.length; c++) {
            const indexes = indexMap[row[c]!];
            const pos = K.vec2(c * sz, r * sz);
            const cEntry: ColliderEntry[] = [];
            const tEntry: TileEntry[] = [];
            tRow.push(tEntry);
            cRow.push(cEntry);
            if (indexes === undefined) continue;
            for (var index of indexes) {
                switch (typeof index) {
                    case "string":
                        entityOrDoorSlots[index] = pos;
                        break;
                    case "number":
                        const desc = tileDefs[index];
                        if (desc?.render !== undefined) {
                            tEntry.push({
                                pos,
                                r: desc.render,
                                ds: desc.depth,
                                auto: desc.autotile,
                                tags: desc.tags ?? []
                            });
                        }
                        if (desc?.physics !== undefined) {
                            cEntry.push({
                                i: index,
                                pos,
                                def: desc.physics,
                                tags: desc.tags ?? []
                            });
                        }
                        break;
                    default:
                        index satisfies never;
                        throw new Error("unknown index object " + index);
                }
            }
        }
    }
    return { colliders: mergeColliders(colliders, sz), tiles: autotile(tiles), slots: entityOrDoorSlots };
}
