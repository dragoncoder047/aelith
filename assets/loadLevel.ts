import { GameObj, LevelComp } from "kaplay";
import { WORLD_FILE } from "../assets";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { MParser } from './mparser';
import { player } from "../player";

K.load((async () => {
    var txt = await fetch(WORLD_FILE).then(r => r.text());
    MParser.world = K.addLevel(txt.split("\n"), {
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        tiles: {}, // everything is handled by MParser
        pos: K.vec2(64, 64),
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
    }) as GameObj<LevelComp>;

    try {
        MParser.build();
        MParser.mergeAcross();
    } catch (e: any) {
        const msg = `Tilemap build error: ${e.stack || e.toString()}`;
        K.debug.error(msg);
        K.debug.paused = true;
        throw new Error(msg);
    }

    const playerPositions = MParser.world.get("playerPosition");
    if (playerPositions.length == 0) {
        throw new SyntaxError(`need a @ in ${WORLD_FILE}`);
    }
    if (playerPositions.length > 1) {
        console.warn(`Multiple @'s in ${WORLD_FILE} - using the first one`);
    }
    player.pos = playerPositions[0]!.worldPos();
    playerPositions.forEach(K.destroy);

})());
