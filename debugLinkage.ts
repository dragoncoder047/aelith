import { GameObj, PosComp, Vec2 } from "kaplay";
import { MParser } from "./levels/mparser";
import { LinkComp } from "./components/linked";
import { K } from "./init";
import { SCALE } from "./constants";
import COLORS from "./assets/gollyColors.json";
import { WorldManager } from "./levels";

K.add([{
    drawInspect() {
        const allObjs = WorldManager.activeLevel?.levelObj.get<LinkComp | PosComp>("linked") ?? [];
        const groups = new Map<string, GameObj<LinkComp | PosComp>[]>;
        const names: string[] = [];
        for (var obj of allObjs) {
            if (groups.has(obj.linkGroup)) groups.get(obj.linkGroup)!.push(obj);
            else {
                names.push(obj.linkGroup);
                groups.set(obj.linkGroup, [obj]);
            }
        }
        for (var i = 0; i < names.length; i++) {
            K.drawLines({
                pts: sort2shortest(groups.get(names[i]!)!.map(p => p.worldPos()!)),
                width: 4 / SCALE,
                color: K.rgb(COLORS[3 * i] ?? 0, COLORS[3 * i + 1] ?? 0, COLORS[3 * i + 2] ?? 0),
            });
        }
    }
}]);

function sort2shortest(ps: Vec2[]): Vec2[] {
    const best = { arr: [] as Vec2[], score: Infinity };
    for (var c of permutations(ps)) {
        const score = c.map((p, i) => i > 0 ? p.dist(c[i-1]!) : 0).reduce((a, b) => a + b, 0);
        if (score < best.score) {
            best.score = score;
            best.arr = c;
        }
    }
    return best.arr;
}

function* permutations<T>(xs: T[]): Generator<T[], undefined, undefined> {
    // https://stackoverflow.com/a/37580979/23626926
    var len = xs.length,
        c = new Array(len).fill(0),
        i = 1, k;

    while (i < len) {
        if (c[i] < i) {
            k = i % 2 && c[i];
            [xs[i], xs[k]] = [xs[k]!, xs[i]!];
            c[i]++;
            i = 1;
            yield xs.slice();
        } else {
            c[i] = 0;
            i++;
        }
    }
}
