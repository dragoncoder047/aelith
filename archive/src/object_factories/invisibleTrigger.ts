import { Tag } from "kaplay";
import { invisibleTriggerComp } from "../components/invisibleTrigger";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";
import { clicky } from "../components/clicky";

export function invisibleTrigger() {
    return [
        K.rect(TILE_SIZE, TILE_SIZE),
        K.opacity(0),
        ...machine(),
        invisibleTriggerComp(),
        clicky(["on"], ["alert"]),
        "raycastIgnore" as Tag,
        "dont-highlight" as Tag,
    ];
}
