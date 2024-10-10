import { CompList } from "kaplay";
import { ambiance } from "../components/ambientSound";
import { animRun } from "../components/animRun";
import { FRICTION } from "../constants";
import { K } from "../init";
import { machine } from "./machine";

export function fan(): CompList<any> {
    return [
        K.sprite("fan"),
        K.body({ isStatic: true }),
        K.tile({ isObstacle: true }),
        ...machine({ friction: FRICTION }),
        animRun("spin"),
        ambiance("fan_running", "fan_start", "fan_stop"),
    ];
}
