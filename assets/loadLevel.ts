import { GameObj, LevelComp, PosComp } from "kaplay";
import { STRINGS_FILE, WORLD_FILE } from ".";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { MParser } from "./mparser";

K.load((async () => {
    const [txt, strings] = await Promise.all([
        fetch(WORLD_FILE).then(r => r.text()),
        fetch(STRINGS_FILE).then(j => j.json())
    ]);
    MParser.world = K.addLevel(txt.split("\n"), {
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
    MParser.strings = strings;
    try {
        await nextFrame();
        console.log("init");
        MParser.build();
        console.log("built")
        await nextFrame();
        MParser.mergeAcross();
        console.log("merge")
    } catch (e: any) {
        const msg = `Tilemap build error: ${e.stack || e.toString()}`;
        K.debug.error(msg);
        K.debug.paused = true;
        throw new Error(msg);
    }

    const playerPositions = MParser.world!.get("playerPosition") as GameObj<PosComp>[];
    if (playerPositions.length == 0) {
        throw new SyntaxError(`need a @ in ${WORLD_FILE}`);
    }
    if (playerPositions.length > 1) {
        console.warn(`Multiple @'s in ${WORLD_FILE} - using the first one`);
    }
    player.pos = playerPositions[0]!.worldPos()!;
    playerPositions.forEach(K.destroy);
    // prevent superfast scroll on load
    K.camPos(player.worldPos()!);

})());

function nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
