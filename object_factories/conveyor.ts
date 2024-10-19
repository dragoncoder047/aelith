import { ambiance } from "../components/ambientSound";
import { conveyor as conveyorComp } from "../components/conveyor";
import { nudge } from "../components/nudge";
import { spriteToggle } from "../components/spriteToggle";
import { K } from "../init";
import { machine } from "./machine";

export function conveyor() {
    return [
        K.sprite("conveyor"),
        spriteToggle(),
        ...machine(),
        K.body({ isStatic: true }),
        conveyorComp(),
        K.surfaceEffector({ speed: 0, forceScale: Number.MAX_VALUE }),
        nudge(0, 8),
        ambiance("conveyor_running"),
    ]
}
