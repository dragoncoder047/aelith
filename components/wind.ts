import { AreaComp, BodyComp, Comp, GameObj, PosComp, StateComp } from "kaplay";
import { WALK_SPEED, WIND_FORCE } from "../constants";
import { K } from "../init";
import { LinkComp } from "./linked";
import { TogglerComp } from "./toggler";
type AreaEffectorComp = ReturnType<typeof K.areaEffector>; // why is this necessary??

export interface WindComp extends Comp {
    windForce: number
    windDirection: number
}

export function wind(states: [string, string] = ["off", "on"]): WindComp {
    return {
        id: "wind",
        require: ["areaEffector", "area", "state", "linked", "toggler"],
        windDirection: -90,
        windForce: WIND_FORCE,
        add(this: GameObj<AreaEffectorComp | AreaComp | StateComp | LinkComp | TogglerComp>) {
            this.onCollideUpdate((obj: GameObj<BodyComp | PosComp>) => {
                if (!this.force.isZero()
                    && this.force.y < 0
                    && obj.has(["body", "pos"])
                    && obj.curPlatform() !== null) {
                    obj.move(0, -WALK_SPEED);
                    obj.jump(Number.EPSILON);
                }
            });
        },
        update(this: GameObj<WindComp | AreaEffectorComp | StateComp>) {
            // why is this necessary??
            this.force = K.Vec2.fromAngle(this.windDirection).scale(this.windForce * states.indexOf(this.state))
        }
    };
}
