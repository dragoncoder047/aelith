import { Comp, GameObj, SpriteComp, SurfaceEffectorComp, StateComp } from "kaplay";

export interface ConveyorComp extends Comp {
    turnSpeed: number,
    direction: number,
}

export function conveyor(states: [string, string] = ["off", "on"], speed: number): ConveyorComp {
    var __lastState: string;
    return {
        id: "conveyor",
        require: ["linked", "sprite", "state", "body", "surfaceEffector"],
        turnSpeed: speed,
        direction: 1,
        update(this: GameObj<ConveyorComp | StateComp | SurfaceEffectorComp | SpriteComp>) {
            this.speed = this.turnSpeed * states.indexOf(this.state) * this.direction;
            if (__lastState === this.state) return;
            if (this.state === states[0]) {
                this.animSpeed = 0;
            }
            else {
                this.animSpeed = Math.abs(this.direction);
                this.play(this.direction === 1 ? "forward" : "backward");
            }
            __lastState = this.state;
        },
        inspect() {
            return `conveyor speed ${this.turnSpeed}`;
        }
    };
}
