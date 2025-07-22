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
    introduction: TextChunk[];
    cutsceneOnce: boolean;
}

export const WorldManager = {
    allLevels: {} as Record<string, Level>,
    activeLevel: undefined as Level | undefined,
    onlyFirstTime: true,
    seenCutscenes: {} as Record<string, boolean>,
    loadLevel(id: string, map: string, whichPos: number = 0) {
        const parser = new MParser(id);
        const levelObj = K.addLevel(map.split("\n"), {
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
            tiles: {}, // everything is handled by MParser
            wildcardTile: (cmd, pos) => parser.process(cmd, pos),
        });
        console.log("initialized level", id);
        parser.preprocess(levelObj);
        console.log("preprocessed level", id);
        parser.build(levelObj);
        console.log("built level", id);
        parser.midprocess(levelObj);
        console.log("midprocessed level", id);
        parser.merge(levelObj);
        console.log("merged level", id);
        parser.postprocess(levelObj);
        console.log("postprocessed level", id);
        this.activateLevel(levelObj, false);
        const playerPositions = levelObj.get<PosComp>("playerPosition");
        const initialPos = playerPositions.at(whichPos)?.worldPos()!;
        playerPositions.forEach(p => p.destroy());
        this.allLevels[id] = {
            id,
            levelObj,
            name: parser.vars.name,
            initialPos,
            introduction: parser.vars.introduction ?? [],
            cutsceneOnce: parser.vars.cutsceneOnce!,
        }
    },
    async goLevel(id: string, fast = false, first = false) {
        const levelTo = this.allLevels[id];
        if (!levelTo) throw new Error(`no such level: "${id}"`);
        player.freeze(true);
        if (this.seenCutscenes[id]) {
            if (this.onlyFirstTime) fast = true;
            if (levelTo.cutsceneOnce) fast = true;
        }
        await playTransition(levelTo.name, levelTo.introduction, fast, first, () => {
            this.pause(true);
            player.hidden = true;
            this.activeLevel = levelTo;
            this.seenCutscenes[id] = true;
        });
        player.hidden = false;
        player.tpTo(levelTo.initialPos ?? K.vec2(0));
        this.pause(false);
    },
    activateLevel(level: GameObj<LevelComp>, running: boolean, visible = running) {
        level.paused = !running;
        level.hidden = !visible;
        level.children.forEach(c => {
            c.paused = !running;
            c.hidden = !visible;
        });
    },
    pause(isPaused: boolean) {
        if (this.activeLevel) {
            this.activateLevel(this.activeLevel.levelObj, !isPaused);
        }
        player.freeze(isPaused);
    },
    getLevelOf(obj: GameObj): GameObj<LevelComp> | null {
        while (obj.parent) {
            if (obj.has("level")) return obj as GameObj<LevelComp>;
            obj = obj.parent;
        }
        return null;
    }
};
