import { GameObj, LevelComp, PosComp, Vec2 } from "kaplay";
import { p3DHelper } from "../components/pseudo3D";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { playTransition } from "../transitions";
import { MParser } from "./mparser";

interface Level {
    id: string;
    levelObj: GameObj<LevelComp>;
    initialPos: Vec2 | undefined;
}

export const WorldManager = {
    allLevels: {} as Record<string, Level>,
    activeLevel: undefined as Level | undefined,
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
        // add pseudo-3D stuff
        levelObj.use(p3DHelper());
        this.allLevels[id] = {
            id,
            levelObj,
            initialPos,
        }
    },
    async goLevel(id: string, half = false, fast = false, overridePos?: Vec2) {
        const levelTo = this.allLevels[id];
        if (!levelTo) throw new Error(`no such level: "${id}"`);
        const doSwitch = () => {
            this.pause(true);
            this.activeLevel = levelTo;
            player.tpTo(overridePos ?? levelTo.initialPos ?? K.vec2(0));
            this.pause(false);
        }
        if (fast) doSwitch();
        else {
            player.freeze(true);
            await playTransition(half, doSwitch);
        }
    },
    activateLevel(level: GameObj<LevelComp>, running: boolean, visible = running) {
        level.paused = !running;
        level.hidden = !visible;
        // This shouldn't be necessary, but it is and I cannot figure out why
        level.get("*", { recursive: true }).forEach(c => {
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
