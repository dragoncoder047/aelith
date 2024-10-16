import { Comp, GameObj, SpriteComp } from "kaplay";
import { K } from "../init";

export interface RandomFrameComp extends Comp {
}

export function randomFrame(): RandomFrameComp {
    return {
        id: "random-frame",
        require: ["sprite"],
        add(this: GameObj<SpriteComp | RandomFrameComp>) {
            const x = K.onUpdate(() => {
                if (this.numFrames() > 0) { // Wait for frame data to load
                    this.frame = K.randi(this.numFrames());
                    x.cancel();
                    this.unuse("random-frame");
                }
            });
        }
    };
}
