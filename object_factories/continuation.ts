import { CompList, Vec2 } from "kaplay";
import continuationTypes from "../assets/trapTypes.json";
import { continuationCore } from "../components/continuationCore";
import { ContinuationData } from "../components/continuationTrap";
import { K } from "../init";
import { defaults } from "./default";

export function continuation(
    pos: Vec2,
    type: keyof typeof continuationTypes,
    captured: ContinuationData
): CompList<any> {
    return [
        K.sprite("continuation", { anim: "spin" }),
        K.pos(pos),
        ...defaults(),
        continuationCore(type, captured),
    ];
}
