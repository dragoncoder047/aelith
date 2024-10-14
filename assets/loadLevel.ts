import { GameObj, LevelComp, PosComp } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K, nextFrame } from "../init";
import { player } from "../player";
import { MParser } from "./mparser";
import { doStartup } from "../startup";
import { worldFileSrc } from ".";

K.load((async () => {
    MParser.world = K.addLevel(worldFileSrc.split("\n"), {
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        tiles: {}, // everything is handled by MParser
        wildcardTile(cmd, pos) {
            try {
                return MParser.process(cmd, pos);
            } catch (e: any) {
                const at = `line ${pos.y + 1}, col ${pos.x + 1}`;
                const msg = `Tilemap error at ${at}: ${e.stack || e.toString()}`;
                K.debug.error(msg);
                K.debug.paused = true;
                throw new SyntaxError(msg);
            }
        }
    }) as GameObj<LevelComp | PosComp>;
    try {
        await nextFrame();
        MParser.build();
        await nextFrame();
        MParser.mergeAcross();
    } catch (e: any) {
        const msg = `Tilemap build error: ${e.stack || e.toString()}`;
        K.debug.error(msg);
        K.debug.paused = true;
        throw new Error(msg);
    }

    const playerPositions = MParser.world!.get("playerPosition") as GameObj<PosComp>[];
    if (playerPositions.length == 0) {
        throw new SyntaxError(`need a @ in WORLD_FILE`);
    }
    if (playerPositions.length > 1) {
        console.warn(`Multiple @'s in WORLD_FILE - using the first one`);
    }
    const moveBy = playerPositions[0]!.worldPos()!.sub(player.pos);
    player.moveBy(moveBy);
    // move tail segments too
    K.get("tail").forEach(t => t.moveBy(moveBy));
    // remove player position things
    playerPositions.forEach(K.destroy);
    // prevent superfast scroll on load
    K.camPos(player.worldPos()!);
    // do startup sequence
    doStartup();

})());
