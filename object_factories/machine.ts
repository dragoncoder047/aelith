import { AreaCompOpt, CompList } from "kaplay";
import { MParser } from "../assets/mparser";
import { linked } from "../components/linked";
import { toggler } from "../components/toggler";
import { K } from "../init";
import { defaults } from "./default";


/**
 * Return components for a machine
 */
export function machine(areaOpts?: AreaCompOpt): CompList<any> {
    return [
        toggler("off", "on", false),
        K.state("off"),
        linked(MParser.uid()),
        ...defaults(areaOpts)
    ];
}
