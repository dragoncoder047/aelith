import { AreaComp, BodyComp, Comp, GameObj, PlatformEffectorComp, PosComp, SpriteComp } from "kaplay";
import { K } from "../init";

export interface BoxComp extends Comp {
}

export function boxComp(): BoxComp {
    return {
        id: "box",
        require: ["body", "platformEffector"],
        add(this: GameObj<SpriteComp | BodyComp | AreaComp | BoxComp | PosComp | PlatformEffectorComp>) {
            const x = K.onUpdate(() => {
                if (this.numFrames() > 0) { // Wait for frame data to load
                    this.frame = K.randi(this.numFrames());
                    x.cancel();
                }
            });
        }
    };
}
