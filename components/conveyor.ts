import { Comp, GameObj, SpriteComp /*, SurfaceEffectorComp */, StateComp } from "kaplay";
import { CONVEYOR_SPEED } from "../constants";
import { K } from "../init";
type SurfaceEffectorComp = ReturnType<typeof K.surfaceEffector>; // why is this necessary??

type ConveyorMode = "l" | "r" | "lr" | "rl";

export interface ConveyorComp extends Comp {
    mode: ConveyorMode,
    turnSpeed: number,
    _speeds: [number, number] | [],
    __lastX: number,
    _recomputeSpeeds(): void,
}

export function conveyor(states: [string, string] = ["off", "on"], mode: ConveyorMode = "lr"): ConveyorComp {
    var closure__mode = mode;
    return {
        id: "conveyor",
        require: ["linked", "sprite", "state", "body", "surfaceEffector"],
        get mode() { return closure__mode; },
        set mode(newMode) {
            closure__mode = newMode;
            this._recomputeSpeeds();
        },
        turnSpeed: -CONVEYOR_SPEED,
        _speeds: [],
        __lastX: 0,
        add() {
            this._recomputeSpeeds();
        },
        update(this: GameObj<ConveyorComp | StateComp | SurfaceEffectorComp | SpriteComp>) {
            const x = this._speeds[states.indexOf(this.state)]!;
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
        _recomputeSpeeds() {
            switch (closure__mode) {
                case "l":
                    this._speeds = [0, -1];
                    break;
                case "r":
                    this._speeds = [0, 1];
                    break;
                case "lr":
                    this._speeds = [-1, 1];
                    break;
                case "rl":
                    this._speeds = [1, -1];
                    break;
                default:
                    throw new Error("bad conveyor mode " + this.mode);
            }
        },
        inspect() {
            return `conveyor mode ${this.mode}`;
        }
    };
}
