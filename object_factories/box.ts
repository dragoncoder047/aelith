import { CompList, GameObj } from "kaplay";
import { cloneable } from "../components/cloneable";
import { grabbable } from "../components/grabbable";
import { holdOffset } from "../components/holdOffset";
import { lore } from "../components/lore";
import { randomFrame } from "../components/randomFrame";
import { FRICTION, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";
import { throwablePlatformEff } from "./throwablePlatformEff";

/**
 * Components for a moveable, grabbable box.
 */
export function box(): CompList<any> {
    return [
        K.sprite("box", { fill: false }),
        "box",
        K.body({ maxVelocity: TERMINAL_VELOCITY }),
        ...machine({
            // make box a teeny bit smaller so that it fits down holes
            // and I don't have to stomp on it
            scale: (TILE_SIZE - 1) / TILE_SIZE,
            friction: FRICTION,
            restitution: RESTITUTION,
            shape: new K.Polygon([
                K.vec2(-7 / 16, -1 / 2),
                K.vec2(7 / 16, -1 / 2),
                K.vec2(1 / 2, -7 / 16),
                K.vec2(1 / 2, 7 / 16),
                K.vec2(7 / 16, 1 / 2),
                K.vec2(-7 / 16, 1 / 2),
                K.vec2(-1 / 2, 7 / 16),
                K.vec2(-1 / 2, -7 / 16),
            ].map(v => v.scale(TILE_SIZE)).toReversed()),
        }),
        K.tile({ isObstacle: true }),
        grabbable(),
        holdOffset(K.vec2(0)),
        K.layer("boxes"),
        K.named("data"),
        randomFrame(),
        ...throwablePlatformEff(),
        cloneable((orig: GameObj<any>) => [...box(), K.pos((orig as any).pos)], ["frame"]),
        lore({
            body: "&msg.lore.box.body",
            secName: "&msg.lore.box.secName",
            section: "&msg.lore.box.section",
            header: "&msg.lore.box.header",
        }),
    ];
}
