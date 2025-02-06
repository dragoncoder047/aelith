import { GameObj, LevelComp, PosComp } from "kaplay";
import { worldFileSrc } from ".";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { doStartup } from "../startup";
import { MParser } from "./mparser";

K.load((async () => {
    MParser.world = K.addLevel(worldFileSrc.split("\n"), {
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        tiles: {}, // everything is handled by MParser
        wildcardTile: (cmd, pos) => MParser.process(cmd, pos),
    }) as GameObj<LevelComp | PosComp>;

    MParser.merge();

})());

K.onLoad(() => {
    MParser.build();
    MParser.postprocess();

    const isDebug = !!MParser.vars.testingMode;
    const playerPositions = MParser.world!.get<PosComp>("playerPosition");
    if (playerPositions.length === 0)
        throw new SyntaxError("need a @ in WORLD_FILE");
    if (playerPositions.length > 1)
        console.warn(`Multiple @'s in WORLD_FILE - using the ${isDebug ? "last" : "first"} one`);
    MParser.pausePos = playerPositions[0]!.worldPos()!;
    const startPos = playerPositions.at(isDebug ? -1 : 0);
    const moveBy = startPos!.worldPos()!.sub(player.pos).add(0, TILE_SIZE / 2);
    player.moveBy(moveBy);
    // move tail segments too
    K.get("tail").forEach(t => t.moveBy(moveBy));
    // remove player position things
    playerPositions.forEach(K.destroy);
    // prevent superfast scroll on load
    K.setCamPos(player.worldPos()!);

    doStartup().catch(e => K.onUpdate(() => { throw e; }));
});