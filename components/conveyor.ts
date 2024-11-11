import { Comp, GameObj, SpriteComp /*, SurfaceEffectorComp */, StateComp } from "kaplay";
import { K } from "../init";
type SurfaceEffectorComp = ReturnType<typeof K.surfaceEffector>; // why is this necessary??

export interface ConveyorComp extends Comp {
    turnSpeed: number,
    direction: 1 | -1,
    __lastX: number,
}

export function conveyor(states: [string, string] = ["off", "on"], speed: number): ConveyorComp {
    return {
        id: "conveyor",
        require: ["linked", "sprite", "state", "body", "surfaceEffector"],
        turnSpeed: speed,
        direction: 1,
        __lastX: 0,
        update(this: GameObj<ConveyorComp | StateComp | SurfaceEffectorComp | SpriteComp>) {
            const x = states.indexOf(this.state);
            this.speed = this.turnSpeed * x * this.direction;
            if (this.__lastX === x) return;
            if (x === 0) {
                this.animSpeed = 0;
            }
            else {
                this.animSpeed = 1;
                this.play(this.direction === 1 ? "forward" : "backward");
            }
            this.__lastX = x;
        },
        inspect() {
            return `conveyor speed ${this.turnSpeed}`;
        }
    };
}
