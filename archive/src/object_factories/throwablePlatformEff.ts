import { Tag } from "kaplay";
import { thudder } from "../components/thudder";
import { K } from "../init";
import { player } from "../player";

export function throwablePlatformEff() {
    return [
        K.platformEffector({
            shouldCollide(obj, normal) {
                if (obj !== player) return true;
                if (K.UP.eq(normal)) return false;
                if (player.lastMotionVector.slen() > 1.3) return true;
                if (K.LEFT.eq(normal)) return false;
                if (K.RIGHT.eq(normal)) return false;
                return true;
            },
        }),
        thudder(),
        "noCollideWithTail" as Tag,
    ];
}
