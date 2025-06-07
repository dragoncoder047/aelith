import { ambiance } from "../components/ambientSound";
import { animRun } from "../components/animRun";
import { fan as fanComp } from "../components/fan";
import { FRICTION } from "../constants";
import { K } from "../init";
import { machine } from "./machine";

export function fan() {
    return [
        K.sprite("fan"),
        fanComp(),
        K.body({ isStatic: true }),
        K.tile({ isObstacle: true }),
        ...machine({ friction: FRICTION }),
        K.offscreen({ hide: false }),
        animRun("spin"),
        ambiance("fan_running", "fan_start", "fan_stop"),
    ];
}
