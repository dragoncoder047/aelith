import { AreaComp, Comp, CompList, GameObj, OffScreenComp, PosComp, Shape, SpriteComp, TileComp, TimerController, Vec2 } from "kaplay";
import { MParser } from "../assets/mparser";
import { BG_WALL_OPACITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { bgWall, wall } from "../object_factories/wall";
import { splash } from "../particles";
import { MergeableComp } from "./mergeable";

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
            this.on("preprocess", () => {
                this.chooseSpriteNum();
            });
            this.zap(false);
        },
        chooseSpriteNum(this: GameObj<SpriteComp | PosComp | TileComp>) {
            const pipes = MParser.world!.get<AreaComp>("area")
                .filter(x => x.is("pipe"))
                .map(o => o.worldArea()!);
            const collides = (l: Shape[], p: Vec2) => l.some(o => o.collides(p as any));
            const ds = [K.LEFT, K.UP, K.RIGHT, K.DOWN].map(d => d.scale(TILE_SIZE));
            var frameNo = 0;
            for (var i = 0; i < ds.length; i++) {
                const lookPos = this.worldPos()!.add(ds[i]!);
                const pipeThere = collides(pipes, lookPos);
                if (pipeThere) frameNo |= Math.pow(2, i);
            }
            if (useBackground) {
                const obj: any = MParser.world!.spawn((solid ? wall() : bgWall()) as CompList<ReturnType<typeof wall> & ReturnType<typeof bgWall>>, this.tilePos);
                obj.pos = this.pos;
                obj.tilePos = this.tilePos;
            }
            this.frame = frameNo;
            this.on("postprocess", () => {
                this.unuse("area");
            });
        },
        zap(this: GameObj<PipeComp | PosComp | OffScreenComp | MergeableComp>, now = true, num = 5) {
            if (zappyTimer) zappyTimer.cancel();
            if (now && !this.isOffScreen())
                splash(K.choose(this.squares), () => K.choose([K.YELLOW.lighten(100), K.CYAN.lighten(170)]), num, undefined, ["wall"]);
            zappyTimer = K.wait(K.rand(0, 200) / this.squares.length, () => this.zap());
        },
    }
}
