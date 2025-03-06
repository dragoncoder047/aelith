import { GameObj, Tag, Vec2 } from "kaplay";
import { FanComp } from "../components/fan";
import { wind } from "../components/wind";
import { K } from "../init";
import { machine } from "./machine";

export function windTunnel(pos: Vec2, width: number, height: number, direction: number, fan: GameObj<FanComp>) {
    return [
        K.pos(pos),
        K.rect(width, height),
        K.opacity(0),
        ...machine({
            collisionIgnore: ["tail"]
        }),
        K.offscreen({ hide: false }),
        wind(direction - 90, undefined, fan),
        K.outline(0),
        // this is set by wind comp
        K.areaEffector({ force: K.vec2(0) }),
        "raycastIgnore" as Tag,
    ];
}
