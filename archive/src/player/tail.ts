import { BodyComp, Comp, GameObj, PosComp, Vec2 } from "kaplay"
import { K } from "../init"
import { SpringComp } from "../plugins/kaplay-springs"

export interface TailComp extends Comp {
    restore2Pos(): void
}

export function tail(start: GameObj<PosComp>, startPos: Vec2): TailComp {
    return {
        id: "tail",
        require: ["pos", "spring"],
        restore2Pos(this: GameObj<TailComp | PosComp | SpringComp | BodyComp>) {
            this.worldPos(start.worldPos()!);
            this.vel = K.vec2(0);
        },
        fixedUpdate(this: GameObj<PosComp | TailComp>) {
            if (isNaN(this.pos.x)
                || isNaN(this.pos.y)
                || this.pos.dist(start.toWorld(startPos)) > Math.max(K.width(), K.height())) {
                console.log("found NaN in tail");
                this.restore2Pos();
            }
        }
    }
}
