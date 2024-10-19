import { AreaCompOpt } from "kaplay";
import { K } from "../init";

/**
 * Create default components for common tile objects.
 */
export function defaults(areaOpts?: AreaCompOpt) {
    return [
        K.area(areaOpts!),
        K.anchor("center"),
        K.timer(),
        K.tile({ isObstacle: true }),
        K.rotate(0),
    ];
}
