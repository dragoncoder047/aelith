import { Comp, GameObj, PosComp, Vec2Args } from "kaplay";
import { K } from "../init";

export interface NudgeComp extends Comp {
}

export function nudge(...by: Vec2Args): NudgeComp {
    return {
        id: "nudge",
        require: ["pos"],
        add(this: GameObj<PosComp>) {
            this.on("midprocess", () => {
                // @ts-expect-error
                this.moveBy(K.vec2(...by));
                this.unuse("nudge");
            });
        }
    };
}
