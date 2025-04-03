import { Comp, GameObj, SpriteComp } from "kaplay";
import { K } from "../init";

export interface RandomFrameComp extends Comp {
}

export function randomFrame(): RandomFrameComp {
    return {
        id: "random-frame",
        require: ["sprite"],
        add(this: GameObj<SpriteComp | RandomFrameComp>) {
            K.onUpdate(() => {
                if (this.numFrames() > 0) { // Wait for frame data to load
                    this.frame = K.randi(this.numFrames());
                    this.unuse("random-frame");
                    return K.cancel();
                }
            });
        }
    };
}
