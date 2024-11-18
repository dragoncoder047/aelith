import { GameObj, LevelComp, PosComp, Vec2 } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { MParser } from "./mparser";
import { doStartup } from "../startup";
import { worldFileSrc } from ".";

var firstPos: Vec2;

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
        console.warn(`Multiple @'s in WORLD_FILE - using the last one`);
    firstPos = playerPositions[0]!.worldPos()!;
    const moveBy = playerPositions.at(-1)!.worldPos()!.sub(player.pos).add(0, TILE_SIZE / 2);
    player.moveBy(moveBy);
    // move tail segments too
    K.get("tail").forEach(t => t.moveBy(moveBy));
    // remove player position things
    playerPositions.forEach(K.destroy);
    // prevent superfast scroll on load
    K.camPos(player.worldPos()!);

    MParser.merge();

})());

K.onLoad(() => {
    MParser.build();
    doStartup(firstPos!).catch(e => K.onUpdate(() => { throw e; }));
});