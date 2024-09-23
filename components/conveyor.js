import { CONVEYOR_SPEED } from '../constants.js';

/**
 * @param {string[]} [states=["off", "on"]]
 * @param {"l" | "r" | "lr" | "rl"} mode
 */
export function conveyor(states = ["off", "on"], mode = "lr") {
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
        add() {
            this._recomputeSpeeds();
        },
        update() {
            const x = this._speeds[states.indexOf(this.state)];
            this.speed = this.turnSpeed * x;
            if (this.__lastX === x) return;
            switch (x) {
                case 0:
                    this.animSpeed = 0;;
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
                    throw "bad conveyor mode " + this.mode;
            }
        },
        inspect() {
            return `mode ${this.mode}`;
        }
    };
}
