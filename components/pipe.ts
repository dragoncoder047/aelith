import { Comp, CompList, GameObj, OffScreenComp, PosComp, Rect, SpriteComp, TileComp, TimerComp, Vec2 } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { WorldManager } from "../levels";
import { splash } from "../misc/particles";
import { barrier } from "../object_factories/barrier";
import { grating } from "../object_factories/grating";
import { ladder } from "../object_factories/ladder";
import { bgWall, wall } from "../object_factories/wall";
import { PAreaComp } from "../plugins/kaplay-aabb";
import { MergeableComp } from "./mergeable";

export interface PipeComp extends Comp {
    chooseSpriteNum(): void
    zap(): void
}

enum ZapState {
    QUIESCENT = 0,
    FIRING = 10,
}

const ZAP_SPEED = 0.02;
const OFFSET_FRAC = 9 / 16;
const DIRS = [K.LEFT, K.UP, K.RIGHT, K.DOWN].map(d => d.scale(TILE_SIZE * OFFSET_FRAC));

export function pipeComp(solid = true, useBackground = true): PipeComp {
    var zapPhase = ZapState.QUIESCENT;
    return {
        id: "pipe",
        require: ["sprite", "pos", "tile", "mergeable", "timer"],
        add(this: GameObj<PipeComp | PosComp | TimerComp>) {
            // kludge for kaplayjs/kaplay#805
            if ((this as any)._pipe) return;
            (this as any)._pipe = true;
            this.on("midprocess2", () => {
                this.chooseSpriteNum();
                return K.cancel();
            });
            this.on("postprocess2", () => {
                this.unuse("area");
                return K.cancel();
            });
            this.maxLoopsPerFrame = 1;
            this.loop(ZAP_SPEED, () => {
                if (zapPhase > ZapState.QUIESCENT) zapPhase--;
            });
        },
        chooseSpriteNum(this: GameObj<SpriteComp | PAreaComp | PosComp | TileComp | PipeComp>) {
            const areas = WorldManager.getLevelOf(this)!.get<PAreaComp>("area");
            const connectingThingsWithObjects = areas
                .filter(x => (x.is("pipe") || x.is("machine")) && !x.is("box"))
                .filter(x => x.has("sprite") || x.has("shader"))
                .filter(x => x !== this)
                .map(o => [o, o.aabb()] as const);
            const connectingThings = connectingThingsWithObjects.map(([_, a]) => a);
            const collides = (l: Rect[], p: Vec2) => l.some(o => o.collides(p));
            const wp = this.worldPos()!;
            const look = (items: Rect[], scale = 1) => {
                var n = 0;
                for (var i = 0; i < DIRS.length; i++) {
                    const lookPos = wp.add(DIRS[i]!.scale(scale));
                    const pipeThere = collides(items, lookPos);
                    if (pipeThere) n |= 1 << i;
                }
                return n;
            }
            this.frame = look(connectingThings);
            if (useBackground) {
                var factory: () => CompList<any>;
                const walls = areas
                    .filter(x => x.is("wall"))
                    .map(o => o.aabb());
                const barriers = areas
                    .filter(x => x.is("barrier"))
                    .map(o => o.aabb());
                const gratings = areas
                    .filter(x => x.is("grating"))
                    .map(o => o.aabb());
                const ladders = areas
                    .filter(x => x.is("ladder"))
                    .map(o => o.aabb());
                if (look(gratings) === 0b0101 && solid) factory = grating;
                else if (look(ladders, 1 / OFFSET_FRAC) === 0b1010 && !solid) factory = ladder;
                else if (look(walls) !== 0) factory = (solid ? wall : bgWall);
                else if (look(barriers) !== 0 && solid) factory = barrier;
                else return;
                const obj = WorldManager.getLevelOf(this)!.spawn(factory(), this.tilePos)!;
                obj.pos = this.pos;
                obj.tilePos = this.tilePos;
            }
            // add zap triggering events
            bLoop: for (var [o, area] of connectingThingsWithObjects) {
                if (o === <any>this) continue;
                if (!o.has("toggler")) continue;
                for (var i = 0; i < DIRS.length; i++) {
                    const lookPos = wp.add(DIRS[i]!);
                    if (area.collides(lookPos)) {
                        o.on("toggleInitiate", () => {
                            this.zap();
                        });
                        continue bLoop;
                    }
                }
            }
        },
        zap(this: GameObj<MergeableComp | PipeComp | PosComp | OffScreenComp | TileComp | TimerComp>) {
            if (zapPhase !== ZapState.QUIESCENT) return;
            if (!this.isOffScreen())
                splash(
                    this.worldPos()!,
                    () => K.choose([K.YELLOW.lighten(100), K.CYAN.lighten(170)]),
                    2,
                    -100,
                    true,
                    10,
                    0.1
                );
            zapPhase = ZapState.FIRING;
            this.wait(ZAP_SPEED, () =>
                [K.LEFT, K.UP, K.RIGHT, K.DOWN].forEach(
                    d => WorldManager.getLevelOf(this)!
                        .getAt(this.tilePos.add(d))
                        .forEach(o => o.zap?.())));
        },
        // drawInspect() {
        //     for (var dir of DIRS) {
        //         K.drawCircle({
        //             pos: dir,
        //             radius: 2,
        //             color: K.GREEN
        //         });
        //     }
        // }
    }
}
