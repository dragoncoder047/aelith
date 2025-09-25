import { ColliderEntry } from "./Room";

export function mergeColliders(colliders: ColliderEntry[][][], tileSize: number): ColliderEntry[] {
    const outColliders: ColliderEntry[] = [];
    var x: number, y: number, n: number, x2, y2, addWidth = 0, addHeight = 0, tx, i; // in tiles
    for (y = 0; y < colliders.length; y++) {
        const row = colliders[y]!;
        for (x = 0; x < row.length; x++) {
            const tilesHere = row[x]!;
            for (n = 0; n < tilesHere.length; n++) {
                const thisTile = tilesHere[n]!;
                if (!thisTile.def || !thisTile.def.merge || !thisTile.def.hitbox) {
                    // DON'T push one with no colliders
                    if (thisTile.def && thisTile.def.hitbox) {
                        outColliders.push(thisTile);
                    }
                    continue;
                }
                const check = (xx: number, yy: number) => (colliders[yy]?.[xx] ?? []).some(t => t.i === thisTile.i);
                const destroy = (xx: number, yy: number) => {
                    var row, cell;
                    if ((row = colliders[yy]) !== undefined) {
                        if ((cell = row[xx]) !== undefined) {
                            row[xx] = cell.filter(t => t.i !== thisTile.i);
                        }
                    }
                };
                addWidth = addHeight = 0;
                for (x2 = x + 1; thisTile.def.merge[0] && x2 < row.length; x2++, addWidth++) {
                    if (!check(x2, y)) break;
                    destroy(x2, y);
                }
                downstretchloop: for (y2 = y + 1; thisTile.def.merge[1] && y2 < colliders.length; y2++, addHeight++) {
                    for (tx = x, i = 0; i <= addWidth; tx++, i++) {
                        if (!check(tx, y2)) break downstretchloop;
                    }
                    for (tx = x, i = 0; i <= addWidth; tx++, i++) {
                        destroy(tx, y2);
                    }
                }
                const h = thisTile.def.hitbox;
                const h2 = [
                    h[0],
                    h[1],
                    h[2] + tileSize * addWidth,
                    h[3] + tileSize * addHeight,
                ] as typeof h;
                outColliders.push({ ...thisTile, def: { ...thisTile.def, hitbox: h2 } });
            }
        }
    }
    return outColliders;
}
