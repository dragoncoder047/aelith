import { CompList } from "kaplay";
import { trap } from "../components/continuationTrap";
import { grabbable } from "../components/grabbable";
import { FRICTION, RESTITUTION, TERMINAL_VELOCITY } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { getMotionVector } from "../player/controls/impl";
import { defaults } from "./default";
import { throwablePlatformEff } from "./throwablePlatformEff";

export function continuationTrap(): CompList<any> {
    return [
        K.sprite("continuation_trap"),
        K.body({ maxVelocity: TERMINAL_VELOCITY }),
        ...defaults({
            friction: FRICTION / 8,
            restitution: RESTITUTION
        }),
        K.shader("recolor-red", {
            u_targetcolor: K.RED,
        }),
        trap("capture"),
        K.layer("boxes"),
        grabbable(),
        K.named("{undefined}"),
        ...throwablePlatformEff(),
        // {
        //     add() {
        //         this.onBeforePhysicsResolve(coll => {
        //             K.debug.log(coll);
        //         })
        //     }
        // }
    ];
}