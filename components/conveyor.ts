import { Comp, GameObj, SpriteComp /*, SurfaceEffectorComp */, StateComp } from "kaplay";
import { CONVEYOR_SPEED } from "../constants";
import { K } from "../init";
type SurfaceEffectorComp = ReturnType<typeof K.surfaceEffector>; // why is this necessary??

export interface ConveyorComp extends Comp {
    turnSpeed: number,
    __lastX: number,
}

export function conveyor(states: [string, string] = ["off", "on"], speed: number): ConveyorComp {
    return {
        id: "conveyor",
        require: ["linked", "sprite", "state", "body", "surfaceEffector"],
        turnSpeed: speed,
        __lastX: 0,
        update(this: GameObj<ConveyorComp | StateComp | SurfaceEffectorComp | SpriteComp>) {
            const x = states.indexOf(this.state);
            this.speed = this.turnSpeed * x;
            if (this.__lastX === x) return;
            switch (x) {
                case 0:
                    this.animSpeed = 0;
                    break;
                case 1:
                    this.animSpeed = 1;
                    this.play("forward");
                    break;
                case -1:
                    this.animSpeed = 1;
                    this.play("backward");
                    break;
            }
            this.__lastX = x;
        },
        inspect() {
            return `conveyor speed ${this.turnSpeed}`;
        }
    };
}
