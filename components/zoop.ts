import { CircleComp, Comp, GameObj } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";

export interface ZoopComp extends Comp {
    zoopSpeed: number
    isZooping: boolean
    zoop(radius?: number): Promise<void>
}

export function zoop(): ZoopComp {
    const onZoopEnds = new K.KEvent();
    return {
        id: "zoop",
        require: ["circle"],
        zoopSpeed: TILE_SIZE * 25,
        isZooping: false,
        update(this: GameObj<ZoopComp | CircleComp>) {
            if (!this.isZooping) return;
            this.radius -= this.zoopSpeed * K.dt();
            if (this.radius < 0) {
                this.hidden = true;
                this.isZooping = false;
                onZoopEnds.trigger();
            }
        },
        zoop(this: GameObj<ZoopComp | CircleComp>, radius) {
            this.radius = radius ?? this.radius;
            this.isZooping = true;
            this.hidden = false;
            return new Promise(r => onZoopEnds.addOnce(() => r()));
        }
    }
}

export function zoopRadius(r: number) {
    return Math.min(r, K.vec2(K.width(), K.height()).len() / 2);
}
