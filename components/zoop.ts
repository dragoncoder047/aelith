import { CircleComp, Comp, GameObj, TimerComp } from "kaplay";
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
        require: ["circle", "timer"],
        zoopSpeed: TILE_SIZE * 25,
        isZooping: false,
        zoop(this: GameObj<ZoopComp | CircleComp | TimerComp>, radius) {
            this.radius = radius ?? this.radius;
            const tc = this.tween(this.radius, 0, this.radius / this.zoopSpeed, v => this.radius = v);
            this.hidden = false;
            this.isZooping = true;
            tc.onEnd(() => {
                this.hidden = true;
                this.isZooping = false;
                onZoopEnds.trigger();
            });
            return new Promise(r => onZoopEnds.addOnce(() => r()));
        }
    }
}

export function zoopRadius(r: number) {
    return Math.min(r, K.vec2(K.width(), K.height()).len() / 2);
}
