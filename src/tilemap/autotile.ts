import { hashPoint } from "../utils";
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
                const { with: tilesWith, bits, pats } = tile.auto;
                const check = (dx: number, dy: number, bit: number) => (tiles[y + dy]?.[x + dx] ?? []).some(c => c.tag === tile.tag || (bit & ((tilesWith ?? {})[c.tag] ?? 0)));
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
                const candidateFrames = pats.flatMap((pat, frame) => pat === pattern ? [frame] : []);
                if (candidateFrames.length === 0) {
                    outTiles.push(tile);
                    continue;
                }
                const chosenFrame = candidateFrames[(candidateFrames.length * hashPoint(tile.pos)) | 0] ?? (tile.r as any).frame;
                outTiles.push({ ...tile, r: { ...tile.r, frame: chosenFrame } as any });
            }
        }
    }
    return outTiles;
}
