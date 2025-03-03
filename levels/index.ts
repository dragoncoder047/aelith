import { GameObj, LevelComp, PosComp, Vec2 } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { nextFrame } from "../misc/utils";
import { player } from "../player";
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
    async loadLevel(id: string, map: string, whichPos: number = 0) {
        const parser = new MParser;
        const levelObj = K.addLevel(map.split("\n"), {
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
            tiles: {}, // everything is handled by MParser
            wildcardTile: (cmd, pos) => parser.process(cmd, pos),
        }) as GameObj<LevelComp>;
        levelObj.update();
        levelObj.destroy();
        await nextFrame();
        parser.preprocess(levelObj);
        await nextFrame();
        parser.build(levelObj);
        await nextFrame();
        parser.midprocess(levelObj);
        await nextFrame();
        parser.merge(levelObj);
        await nextFrame();
        parser.postprocess(levelObj);
        await nextFrame();
        const playerPositions = levelObj.get<PosComp>("playerPosition");
        const initialPos = playerPositions.at(whichPos)?.pos;
        this.allLevels[id] = {
            levelObj,
            name: parser.vars.name,
            initialPos,
            introduction: parser.vars.introduction ?? []
        }
    },
    async goLevel(id: string) {
        const level = this.allLevels[id];
        if (!level) throw new Error(`no such level: "${id}"`);
        player.paused = true;
        player.hidden = true;
        this.activeLevel?.destroy();
        await this.transitionScreen(level);
        this.activeLevel = K.add(level.levelObj);
        player.hidden = false;
        player.paused = false;
    },
    async transitionScreen(level: Level) {
        await playTransition(level.name, level.introduction);
    },
    pause(isPaused: boolean) {
        if (this.activeLevel) {
            this.activeLevel.paused = this.activeLevel.hidden = isPaused;
        }
    },
    getLevelOf(obj: GameObj): GameObj | null {
        while (obj.parent) obj = obj.parent;
        return obj;
    }
};
