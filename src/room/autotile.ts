import { chooseWeights, hashPoint } from "../hash";
import { TileEntry } from "./Room";


export function autotile(tiles: TileEntry[][][]): TileEntry[] {
    const outTiles: TileEntry[] = [];
    var x: number, y: number;
    for (var y = 0; y < tiles.length; y++) {
        const row = tiles[y]!;
        for (var x = 0; x < row.length; x++) {
            const tilesHere = row[x]!;
            for (var n = 0; n < tilesHere.length; n++) {
                const tile = tilesHere[n]!;
                if (tile.auto === undefined) {
                    outTiles.push(tile);
                    continue;
                }
                const { with: tilesWith, bits, pats, weights } = tile.auto;
                const twNN = tilesWith ?? {};
                const check = (dx: number, dy: number, bit: number) => (tiles[y + dy]?.[x + dx] ?? []).some(c => c.tag in twNN ? (bit & (twNN[c.tag] ?? 0)) : c.tag === tile.tag);
                const up = check(0, -1, 1);
                const right = check(1, 0, 4);
                const down = check(0, 1, 16);
                const left = check(-1, 0, 64);
                var pattern: number;
                if (bits === 4) {
                    pattern = (up ? 1 : 0) | (right ? 2 : 0) | (down ? 4 : 0) | (left ? 8 : 0);
                } else if (bits === 8) {
                    const upRight = up && right && check(1, -1, 2);
                    const upLeft = up && left && check(-1, -1, 8);
                    const downRight = down && right && check(1, 1, 32);
                    const downLeft = down && left && check(-1, 1, 128);
                    pattern = (up ? 1 : 0) | (upRight ? 2 : 0) | (right ? 4 : 0) | (downRight ? 8 : 0) | (down ? 16 : 0) | (downLeft ? 32 : 0) | (left ? 64 : 0) | (upLeft ? 128 : 0);
                } else {
                    throw new Error(`expected 4 or 8 bits, but got ${bits}`);
                }
                const matching = pats.map(p => p === pattern);
                const candidateFrames = matching.flatMap((v, i) => v ? [i] : []);
                const candidateWeights = matching.flatMap((v, i) => v ? [weights?.[i] ?? 1] : []);
                if (candidateFrames.length === 0) {
                    outTiles.push(tile);
                    continue;
                }
                const chosenFrame = chooseWeights(candidateFrames, candidateWeights, hashPoint(tile.pos)) ?? (tile.r as any).frame;
                var chosenDepth = tile.ds;
                if (Array.isArray(chosenDepth)) {
                    chosenDepth = chosenDepth[chosenFrame] ?? 0;
                }
                outTiles.push({ ...tile, ds: chosenDepth, r: { ...tile.r, frame: chosenFrame } as any });
            }
        }
    }
    return outTiles;
}
