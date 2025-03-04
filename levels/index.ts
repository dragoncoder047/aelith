import { GameObj, LevelComp, PosComp, Vec2 } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { TailComp } from "../player/tail";
import { playTransition, TextChunk } from "../transitions";
import { MParser } from "./mparser";

interface Level {
    levelObj: GameObj<LevelComp>;
    name: string;
    initialPos: Vec2 | undefined;
    introduction: TextChunk[]
}

export const WorldManager = {
    allLevels: {} as Record<string, Level>,
    activeLevel: undefined as GameObj<LevelComp> | undefined,
    loadLevel(id: string, map: string, whichPos: number = 0) {
        const parser = new MParser;
        const levelObj = K.addLevel(map.split("\n"), {
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
            tiles: {}, // everything is handled by MParser
            wildcardTile: (cmd, pos) => parser.process(cmd, pos),
        }) as GameObj<LevelComp>;
        parser.preprocess(levelObj);
        parser.build(levelObj);
        parser.midprocess(levelObj);
        parser.merge(levelObj);
        parser.postprocess(levelObj);
        this.activateLevel(levelObj, false);
        const playerPositions = levelObj.get<PosComp>("playerPosition");
        const initialPos = playerPositions.at(whichPos)?.pos;
        playerPositions.forEach(p => p.destroy());
        this.allLevels[id] = {
            levelObj,
            name: parser.vars.name,
            initialPos,
            introduction: parser.vars.introduction ?? []
        }
    },
    async goLevel(id: string, halfCut: boolean = false) {
        const level = this.allLevels[id];
        if (!level) throw new Error(`no such level: "${id}"`);
        player.hidden = true;
        this.pause(true);
        await playTransition(level.name, level.introduction, halfCut);
        this.activeLevel = level.levelObj;
        player.hidden = false;
        const delta = (level.initialPos ?? K.vec2(0)).sub(player.pos);
        player.moveBy(delta);
        K.get<TailComp>("tail").forEach(t => t.restore2Pos());
        K.setCamPos(player.worldPos()!);
        this.pause(false);
    },
    activateLevel(level: GameObj<LevelComp>, running: boolean) {
        level.get("*", { recursive: true }).forEach(o => o.paused = o.hidden = !running);
    },
    pause(isPaused: boolean) {
        if (this.activeLevel) {
            this.activateLevel(this.activeLevel, !isPaused);
        }
        player.paused = isPaused;
    },
    getLevelOf(obj: GameObj): GameObj | null {
        while (obj.parent && !obj.has("level")) obj = obj.parent;
        return obj;
    }
};
