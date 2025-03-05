import { GameObj, LevelComp, PosComp, Vec2 } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { playTransition, TextChunk } from "../transitions";
import { MParser } from "./mparser";

interface Level {
    id: string;
    levelObj: GameObj<LevelComp>;
    name: string;
    initialPos: Vec2 | undefined;
    introduction: TextChunk[]
}

export const WorldManager = {
    allLevels: {} as Record<string, Level>,
    activeLevel: undefined as Level | undefined,
    everyCutscene: true,
    seenCutscenes: {} as Record<string, boolean>,
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
            id,
            levelObj,
            name: parser.vars.name,
            initialPos,
            introduction: parser.vars.introduction ?? []
        }
    },
    async goLevel(id: string, fast = false, first = false) {
        const levelTo = this.allLevels[id];
        if (!levelTo) throw new Error(`no such level: "${id}"`);
        player.paused = true;
        fast ||= !this.everyCutscene && this.seenCutscenes[id]!;
        await playTransition(levelTo.name, levelTo.introduction, fast, first, () => {
            this.pause(true);
            player.hidden = true;
            this.activeLevel = levelTo;
        });
        this.seenCutscenes[id] = true;
        player.hidden = false;
        player.tpTo(levelTo.initialPos ?? K.vec2(0));
        this.pause(false);
    },
    activateLevel(level: GameObj<LevelComp>, running: boolean, visible = running) {
        level.get("*", { recursive: true }).forEach(o => {
            o.paused = !running;
            o.hidden = !visible;
        });
        level.paused = !running;
        level.hidden = !visible;
    },
    pause(isPaused: boolean) {
        if (this.activeLevel) {
            this.activateLevel(this.activeLevel.levelObj, !isPaused);
        }
        player.paused = isPaused;
    },
    getLevelOf(obj: GameObj): GameObj | null {
        while (obj.parent && !obj.has("level")) obj = obj.parent;
        return obj;
    }
};
