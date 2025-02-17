import { AreaComp, Comp, CompList, GameObj, OffScreenComp, PosComp, Rect, SpriteComp, TileComp, TimerController, Vec2 } from "kaplay";
import { MParser } from "../assets/mparser";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { grating } from "../object_factories/grating";
import { bgWall, wall } from "../object_factories/wall";
import { splash } from "../particles";
import { MergeableComp } from "./mergeable";
import { barrier } from "../object_factories/barrier";

export interface PipeComp extends Comp {
    chooseSpriteNum(): void
    zap(now?: boolean, num?: number): void
}

export function pipeComp(solid = true, useBackground = true): PipeComp {
    var zappyTimer: TimerController
    return {
        id: "pipe",
        require: ["sprite", "pos", "tile", "offscreen", "mergeable"],
        add(this: GameObj<PipeComp | PosComp>) {
            this.on("midprocess2", () => {
                this.chooseSpriteNum();
            });
            this.on("postprocess", () => {
                this.unuse("area");
            });
            this.zap(false);
        },
        chooseSpriteNum(this: GameObj<SpriteComp | PosComp | TileComp>) {
            const areas = MParser.world!.get<AreaComp>("area");
            const pipes = areas
                .filter(x => x.is(["pipe", "machine"], "or"))
                .filter(x => x.has("sprite") || x.has("shader"))
                .map(o => o.worldArea()!.bbox());
            const collides = (l: Rect[], p: Vec2) => l.some(o => o.collides(p));
            const ds = [K.LEFT, K.UP, K.RIGHT, K.DOWN].map(d => d.scale(TILE_SIZE * 4 / 7));
            const wp = this.worldPos()!;
            const look = (items: Rect[]) => {
                var n = 0;
                for (var i = 0; i < ds.length; i++) {
                    const lookPos = wp.add(ds[i]!);
                    const pipeThere = collides(items, lookPos);
                    if (pipeThere) n |= Math.pow(2, i);
                }
                return n;
            }
            this.frame = look(pipes);
            if (useBackground) {
                var factory: () => CompList<any>;
                const walls = areas
                    .filter(x => x.is("wall"))
                    .map(o => o.worldArea()!.bbox());
                const barriers = areas
                    .filter(x => x.is("barrier"))
                    .map(o => o.worldArea()!.bbox());
                const gratings = areas
                    .filter(x => x.is("grating"))
                    .map(o => o.worldArea()!.bbox());
                if (look(gratings) === 0b0101 && solid) factory = grating;
                else if (look(walls) !== 0) factory = (solid ? wall : bgWall);
                else if (look(barriers) !== 0 && solid) factory = barrier;
                else return;
                const obj = MParser.world!.spawn(factory(), this.tilePos)!;
                obj.pos = this.pos;
                obj.tilePos = this.tilePos;
            }
        },
        zap(this: GameObj<PipeComp | PosComp | OffScreenComp | MergeableComp>, now = true, num = 5) {
            if (zappyTimer) zappyTimer.cancel();
            if (now && !this.isOffScreen())
                splash(K.choose(this.squares), () => K.choose([K.YELLOW.lighten(100), K.CYAN.lighten(170)]), num, undefined, ["wall"]);
            zappyTimer = K.wait(K.rand(0, 200) / this.squares.length, () => this.zap());
        },
    }
}
