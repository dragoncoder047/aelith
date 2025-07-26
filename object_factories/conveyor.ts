import { Tag } from "kaplay";
import { ambiance } from "../components/ambientSound";
import { conveyor as conveyorComp } from "../components/conveyor";
import { mergeable } from "../components/mergeable";
import { nudge } from "../components/nudge";
import { spriteToggle } from "../components/spriteToggle";
import { CONVEYOR_SPEED } from "../constants";
import { K } from "../init";
import { machine } from "./machine";
import { interactable } from "../components/interactable";

export function conveyor() {
    return [
        K.sprite("conveyor", { tiled: true }),
        spriteToggle(),
        ...machine(),
        mergeable(),
        K.body({ isStatic: true }),
        conveyorComp(undefined, -CONVEYOR_SPEED),
        K.surfaceEffector({ speed: 0, forceScale: Number.MAX_VALUE }),
        nudge(0, 8),
        ambiance("conveyor_running"),
        interactable(),
        "conveyor" as Tag,
    ]
}
