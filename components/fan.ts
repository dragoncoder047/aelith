import { AreaComp, Comp, GameObj, LevelComp, PosComp, RotateComp } from "kaplay";
import { WindComp } from "./wind";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { windTunnel } from "../object_factories/windTunnel";
import { TogglerComp } from "./toggler";

export interface FanComp extends Comp {
    wind?: GameObj<WindComp | TogglerComp>
    createWind(fromWorld: GameObj<LevelComp>): void
}

export function fan(): FanComp {
    return {
        id: "fan",
        require: ["pos", "rotate", "toggler"],
        createWind(this: GameObj<PosComp | RotateComp | FanComp>, world) {
            const obstacles = world.get<AreaComp>("area")
                .filter(x => x.is(["wall", "barrier", "door", "windEnd"], "or"))
                .map(o => o.worldArea()!);
            const d = K.UP.rotate(this.angle).scale(TILE_SIZE);
            var chk_pt = this.pos.add(d);
            var center = chk_pt;
            var width = TILE_SIZE, height = TILE_SIZE;
            do {
                chk_pt = chk_pt.add(d);
                center = center.add(d.scale(1 / 2));
                width += Math.abs(d.x);
                height += Math.abs(d.y);
            } while (obstacles.every(o => !o.collides(chk_pt as any)));
            center = center.sub(d.scale(1 / 2));
            width -= Math.abs(d.x);
            height -= Math.abs(d.y);
            this.wind = K.add(windTunnel(center, width, height, this.angle));
        },
        update(this: GameObj<FanComp | TogglerComp>) {
            if (this.wind) {
                this.wind.togglerState = this.togglerState;
            }
        }
    }
}
