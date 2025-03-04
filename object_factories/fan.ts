import { ambiance } from "../components/ambientSound";
import { animRun } from "../components/animRun";
import { FRICTION } from "../constants";
import { K } from "../init";
import { machine } from "./machine";
import { fan as fanComp } from "../components/fan"
import { StateManager } from "../save_state";

export function fan() {
    return [
        K.sprite("fan"),
        fanComp(),
        K.body({ isStatic: true }),
        K.tile({ isObstacle: true }),
        ...machine({ friction: FRICTION }),
        animRun("spin"),
        ambiance("fan_running", "fan_start", "fan_stop"),
        { reviver: "fan" },
    ];
}

StateManager.registerReviver("fan", fan);
