import { antivirus as antivirusComp } from "../components/antivirus";
import { K } from "../init";
import { machine } from "./machine";

export function antivirus() {
    return [
        K.sprite("antivirus"),
        ...machine(),
        antivirusComp(),
    ];
}
