import {
    AreaComp,
    BodyComp,
    Comp,
    GameObj,
    StateComp,
    TimerComp
} from "kaplay";
import { LinkComp } from "./linked";

export interface ButtonComp extends Comp {
}

export function button(): ButtonComp {
    return {
        id: "button",
        require: ["collisioner"],
        add(this: GameObj<StateComp | TimerComp | AreaComp | BodyComp | ButtonComp | LinkComp>) {
            this.on("collisionerStart", ([obj, normal]) => {
                obj.vel = obj.vel.reject(normal);
            });
            this.onPhysicsResolve(coll => {
                if (!coll.isTop()) return;
                const obj = coll.target;
                this.trigger("collisionerUpdate", [obj, coll.normal]);
            });
            this.onCollideEnd(obj => {
                this.trigger("collisionerEnd", obj);
            });
        },
    };
}
