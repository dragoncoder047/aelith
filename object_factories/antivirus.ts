import { antivirus as antivirusComp } from "../components/antivirus";
import { K } from "../init";
import { StateManager } from "../save_state";
import { machine } from "./machine";

export function antivirus() {
    return [
        K.sprite("antivirus"),
        ...machine(),
        K.offscreen({ hide: false }),
        antivirusComp(),
        { reviver: "antivirus" }
    ];
}

StateManager.registerReviver("antivirus", antivirus);
