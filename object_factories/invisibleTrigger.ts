import { Tag } from "kaplay";
import { invisibleTriggerComp } from "../components/invisibleTrigger";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";
import { StateManager } from "../save_state";

export function invisibleTrigger() {
    return [
        K.rect(TILE_SIZE, TILE_SIZE),
        K.opacity(0),
        ...machine(),
        invisibleTriggerComp(),
        "raycastIgnore" as Tag,
    ];
}
