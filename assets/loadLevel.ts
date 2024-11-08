import { GameObj, LevelComp, PosComp } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { MParser } from "./mparser";
import { doStartup } from "../startup";
import { worldFileSrc } from ".";

var hadError = false;

K.load((async () => {
    MParser.world = K.addLevel(worldFileSrc.split("\n"), {
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        tiles: {}, // everything is handled by MParser
        wildcardTile: (cmd, pos) => MParser.process(cmd, pos),
    }) as GameObj<LevelComp | PosComp>;

    const playerPositions = MParser.world!.get("playerPosition") as GameObj<PosComp>[];
    if (playerPositions.length === 0)
        throw new SyntaxError(`need a @ in WORLD_FILE`);
    if (playerPositions.length > 1)
        console.warn(`Multiple @'s in WORLD_FILE - using the first one`);
    const moveBy = playerPositions[0]!.worldPos()!.sub(player.pos).add(0, TILE_SIZE / 2);
    player.moveBy(moveBy);
    // move tail segments too
    K.get("tail").forEach(t => t.moveBy(moveBy));
    // remove player position things
    playerPositions.forEach(K.destroy);
    // prevent superfast scroll on load
    K.camPos(player.worldPos()!);

    MParser.merge();

})().catch(err => {
    console.error("load error", err);
    K.onLoad(() => { throw err; });
    hadError = true;
}));

K.onLoad(() => {
    if (hadError) return;
    MParser.build();
    doStartup();
});