import { AreaCompOpt, CompList } from "kaplay";
import { K } from "../init";

/**
 * Create default components for common tile objects.
 */
export function defaults(areaOpts?: AreaCompOpt): CompList<any> {
    return [
        K.area(areaOpts!),
        K.anchor("center"),
        K.timer(),
        K.tile({ isObstacle: true }),
        K.rotate(0),
        K.outline(0, K.WHITE),
    ];
}
