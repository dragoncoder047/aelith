import { CompList, GameObj, Vec2 } from "kaplay";
import continuationTypes from "../assets/trapTypes.json";
import { continuationCore } from "../components/continuationCore";
import { ContinuationData, ContinuationTrapComp } from "../components/continuationTrap";
import { K } from "../init";
import { defaults } from "./default";

export function continuation(
    type: keyof typeof continuationTypes,
    captured: ContinuationData,
    trap: GameObj<ContinuationTrapComp>
): CompList<any> {
    return [
        K.sprite("continuation", { anim: "spin" }),
        K.shader("recolor-red", {
            u_targetcolor: K.RED,
        }),
        K.anchor("center"),
        K.pos(captured.playerPos),
        ...defaults(),
        K.named("{undefined}"),
        continuationCore(type, captured, trap),
    ];
}
