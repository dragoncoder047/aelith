import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { machine } from "./machine";
import { invisibleTriggerComp } from "../components/invisibleTrigger";

export function invisibleTrigger() {
    return [
        K.rect(TILE_SIZE, TILE_SIZE),
        K.opacity(0),
        ...machine(),
        invisibleTriggerComp(),
    ];
}
