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
            this.onCollideUpdate(obj => {
                if (!this.force.isZero()
                    && this.force.y < 0
                    && obj.has(["body", "pos"])
                    && (obj as GameObj<BodyComp>).curPlatform() !== null) {
                    (obj as GameObj<PosComp>).move(0, -WALK_SPEED);
                    (obj as GameObj<BodyComp>).jump(Number.EPSILON);
                }
            });
        },
        update(this: GameObj<WindComp | AreaEffectorComp | StateComp>) {
            // @ts-expect-error
            // why is this necessary??
            this.force = K.Vec2.fromAngle(this.windDirection).scale(this.windForce * states.indexOf(this.state))
        }
    };
}
