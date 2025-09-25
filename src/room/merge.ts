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
    addBridgingColliders(outColliders, tileSize);
    return outColliders;
}

// Thanks ChatGPT.
function addBridgingColliders(colliders: ColliderEntry[], tileSize: number) {
    const olen = colliders.length;
    for (let a = 0; a < olen; a++) {
        const A = colliders[a]!;
        const [lA, tA, rA, bA] = toRect(A);
        for (let b = a + 1; b < olen; b++) {
            const B = colliders[b]!;
            const [lB, tB, rB, bB] = toRect(B);

            // compute overlaps and gaps
            const hOverlap = min(rA, rB) - max(lA, lB);
            const vOverlap = min(bA, bB) - max(tA, tB);
            const gapX = max(lB - rA, lA - rB); // positive if separated horizontally
            const gapY = max(tB - bA, tA - bB); // positive if separated vertically

            // Horizontal neighbor (A left of B or vice versa)
            var connL = 0, connR = 0, connT = 0, connB = 0;
            if (vOverlap > 0 && gapX > 0 && gapX <= tileSize) {
                connL = min(rA, lB);
                connR = max(rA, lB);
                connT = max(tA, tB);
                connB = min(bA, bB);
            }

            // Vertical neighbor (A above B or vice versa)
            else if (hOverlap > 0 && gapY > 0 && gapY <= tileSize) {
                connL = max(lA, lB);
                connR = min(rA, rB);
                connT = min(bA, tB);
                connB = max(bA, tB);
            }
            // guard: ensure positive width/height
            const width = connR - connL;
            const height = connB - connT;
            if (width > 0 && height > 0) {
                colliders.push({ ...A, def: { ...A.def, hitbox: [connL - A.pos.x, connT - A.pos.y, width, height] } });
            }
        }
    }
}

function toRect(c: ColliderEntry): [number, number, number, number] {
    const h = c.def.hitbox;
    const left = h[0] + c.pos.x;
    const top = h[1] + c.pos.y;
    const right = left + h[2];
    const bottom = top + h[3];
    return [left, top, right, bottom];
}

const min = Math.min, max = Math.max;
