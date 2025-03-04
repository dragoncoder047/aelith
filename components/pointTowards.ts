import { Comp, GameObj, PosComp, RotateComp } from "kaplay";

export interface PointTowardsComp extends Comp {
    pointingTowards: GameObj<PosComp> | null
    angleOffset: number;
}

export function pointTowards(what: GameObj<PosComp> | null = null): PointTowardsComp {
    return {
        id: "pointTowards",
        require: ["rotate", "pos"],
        pointingTowards: what,
        angleOffset: 0,
        update(this: GameObj<PosComp | PointTowardsComp | RotateComp>) {
            if (this.pointingTowards)
                this.angle = this.pointingTowards.worldPos()!.sub(this.worldPos()!).angle() + this.angleOffset;
        }
    }
}
