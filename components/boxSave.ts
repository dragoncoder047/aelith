import { Comp } from "kaplay";
import { Saveable } from "../save_state";

export interface BoxSaveComp extends Comp, Saveable {
}

export function boxSaveComp(): BoxSaveComp {
    return {
        id: "box-save",
        reviver: "box",
        liveState() {
            return {};
        },
        restoreLiveState(state) {
        },
        deadState() {
            return {}
        },
        restoreDeadState(state) {
        },
    }
}
