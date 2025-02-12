import { AreaComp, Comp, GameObj, OffScreenComp, PosComp, Shape, SpriteComp, TileComp, TimerController, Vec2 } from "kaplay";
import { MParser } from "../assets/mparser";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { wall } from "../object_factories/wall";
import { splash } from "../particles";

export interface PipeComp extends Comp {
    chooseSpriteNum(): void
    zap(now?: boolean, num?: number): void
}

export function pipeComp(solid = true, useBackground = true): PipeComp {
    var zappyTimer: TimerController
    return {
        id: "pipe",
        require: ["sprite", "pos", "tile", "offscreen"],
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
            const obstacles = MParser.world!.get<AreaComp>("area")
                .filter(x => x.is(["wall", "barrier", "door"], "or"))
                .map(o => o.worldArea()!);
            const ds = [K.LEFT, K.UP, K.RIGHT, K.DOWN, K.vec2(-1, -1), K.vec2(1, -1)].map(d => d.scale(TILE_SIZE));
            var frameNo = 0;
            var wallNo = 0;
            for (var i = 0; i < ds.length; i++) {
                const lookPos = this.worldPos()!.add(ds[i]!);
                const pipeThere = collides(pipes, lookPos);
                const wallThere = collides(obstacles, lookPos);
                if (pipeThere) frameNo |= Math.pow(2, i);
                if (wallThere) wallNo |= Math.pow(2, i);
            }
            if (useBackground) {
                const obj: any = MParser.world!.spawn(wall(), this.tilePos);
                obj.pos = this.pos;
                obj.tilePos = this.tilePos;
                if (!solid) {
                    obj.unuse("area");
                }
            }
            this.frame = frameNo & 15; // only first four count
            this.on("midprocess", () => {
                this.unuse("area");
            });
        },
        zap(this: GameObj<PipeComp | PosComp | OffScreenComp>, now = true, num = 5) {
            if (zappyTimer) zappyTimer.cancel();
            if (now && !this.isOffScreen())
                splash(this.pos, () => K.choose([K.YELLOW.lighten(100), K.CYAN.lighten(170)]), num, undefined, ["wall"]);
            zappyTimer = K.wait(K.rand(0, 200), () => this.zap());
        },
    }
}
