import { AreaCompOpt, GameObj, OffScreenComp, SpriteComp } from "kaplay";
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
        K.offscreen({ hide: true }),
        {
            add(this: GameObj<OffScreenComp | SpriteComp>) {
                const ec = this.on("postprocess", () => {
                    this.offscreenDistance = K.vec2(this.width, this.height).slen();
                    ec.cancel();
                })
            }
        }
    ];
}
