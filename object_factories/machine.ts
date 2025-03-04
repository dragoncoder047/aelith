import { AreaCompOpt, Tag } from "kaplay";
import { MParser } from "../levels/mparser";
import { linked } from "../components/linked";
import { toggler } from "../components/toggler";
import { K } from "../init";
import { defaults } from "./default";

/**
 * Return components for a machine
 */
export function machine(areaOpts?: AreaCompOpt) {
    return [
        toggler("off", "on", false),
        K.state("off"),
        linked(MParser.uid()),
        K.offscreen({ hide: true }),
        ...defaults(areaOpts),
        "saveable" as Tag,
    ];
}
