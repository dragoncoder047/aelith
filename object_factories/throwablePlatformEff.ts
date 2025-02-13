import { Tag, Vec2 } from "kaplay";
import { thudder } from "../components/thudder";
import { K } from "../init";
import { player } from "../player";

// async import
var getPlayerMotionVector: () => Vec2;
import("../controls").then(m => getPlayerMotionVector = m.getPlayerMotionVector);

export function throwablePlatformEff() {
    return [
        K.platformEffector({
            shouldCollide(obj, normal) {
                if (obj !== player) return true;
                if (K.UP.eq(normal)) return false;
                if (getPlayerMotionVector().slen() > 1.3) return true;
                if (K.LEFT.eq(normal)) return false;
                if (K.RIGHT.eq(normal)) return false;
                return true;
            },
        }),
        thudder(),
        "throwable" as Tag,
        "noCollideWithTail" as Tag,
    ];
}
