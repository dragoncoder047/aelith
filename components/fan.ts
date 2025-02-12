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
            this.on("preprocess", () => {
                this.createWind();
            });
        },
        createWind(this: GameObj<PosComp | RotateComp | FanComp>) {
            const obstacles = MParser.world!.get<AreaComp>("area")
                .filter(x => x.is(["wall", "barrier", "door", "windEnd"], "or"))
                .map(o => o.worldArea()!);
            const collides = (p: Vec2) => obstacles.some(o => o.collides(p as any));
            const d = K.UP.rotate(this.angle).scale(TILE_SIZE);
            var chk_pt = this.pos.add(d);
            var center = chk_pt;
            var width = TILE_SIZE, height = TILE_SIZE;
            do {
                chk_pt = chk_pt.add(d);
                center = center.add(d.scale(1 / 2));
                width += Math.abs(d.x);
                height += Math.abs(d.y);
            } while (!collides(chk_pt));
            center = center.sub(d.scale(1 / 2));
            width -= Math.abs(d.x);
            height -= Math.abs(d.y);
            // TODO: check if direct corner
            this.wind.push(K.add(windTunnel(center, width, height, this.angle)));
        },
        update(this: GameObj<FanComp | TogglerComp>) {
            this.wind.forEach(w => w.togglerState = this.togglerState);
        }
    }
}
