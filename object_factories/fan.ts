import { CompList } from "kaplay";
import { machine } from "./machine";
import { K } from "../init";
import { animRun } from "../components/animRun";
import { FRICTION } from "../constants";

export function fan(): CompList<any> {
    return [
        K.sprite("fan"),
        K.body({ isStatic: true }),
        K.tile({ isObstacle: true }),
        ...machine({ friction: FRICTION }),
        animRun("spin"),
    ];
}
