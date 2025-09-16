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
                this.on("postprocess", () => {
                    this.offscreenDistance = Math.max(K.center().len(), K.vec2(Math.max(this.width, this.height)).len());
                    return K.cancel();
                })
            }
        }
    ];
}
