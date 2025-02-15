import { AreaComp, Comp, GameObj, LevelComp, PosComp, RotateComp, Vec2 } from "kaplay";
import { MParser } from "../assets/mparser";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { windTunnel } from "../object_factories/windTunnel";
import { TogglerComp } from "./toggler";
import { WindComp } from "./wind";

export interface FanComp extends Comp {
    wind: GameObj<WindComp | TogglerComp>[]
    createWind(): void
}

export function fan(): FanComp {
    return {
        id: "fan",
        require: ["pos", "rotate", "toggler"],
        wind: [],
        add(this: GameObj<FanComp>) {
            this.on("midprocess", () => {
                this.createWind();
            });
        },
        createWind(this: GameObj<PosComp | RotateComp | FanComp>) {
            const obstacles = MParser.world!.get<AreaComp>("area")
                .filter(x => x.is(["wall", "barrier", "door", "windEnd"], "or"))
                .map(o => o.worldArea()!);
            const collides = (p: Vec2) => obstacles.some(o => o.collides(p as any));
            var a = this.angle;
            var d: Vec2 | undefined = K.UP.rotate(a).scale(TILE_SIZE);
            var chk_pt = this.pos.add(d);
            while (d !== undefined) {
                var center = chk_pt;
                var width = TILE_SIZE, height = TILE_SIZE;
                do {
                    chk_pt = chk_pt.add(d);
                    center = center.add(d.scale(1 / 2));
                    width += Math.abs(d.x);
                    height += Math.abs(d.y);
                } while (!collides(chk_pt));
                chk_pt = chk_pt.sub(d);
                center = center.sub(d.scale(1 / 2));
                width -= Math.abs(d.x);
                height -= Math.abs(d.y);
                this.wind.push(K.add(windTunnel(center, width, height, a)));
                // check if direct corner
                const dd: [number | null, Vec2][] = [
                    [a - 90, d.rotate(-90)],
                    [a + 90, d.rotate(90)],
                    [null, d.rotate(90).sub(d)],
                    [null, d.rotate(-90).sub(d)]
                ];
                var seeway = false;
                var oneway = false;
                for (var [a2, d2] of dd) {
                    if (!collides(chk_pt.add(d2))) {
                        if (!seeway) {
                            d = d2;
                            a = a2!;
                            seeway = true;
                            oneway = true;
                        } else oneway = false;
                    }
                }
                if (!oneway) break;
            }
        },
        update(this: GameObj<FanComp | TogglerComp>) {
            this.wind.forEach(w => w.togglerState = this.togglerState);
        },
    }
}
