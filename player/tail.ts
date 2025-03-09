import { BodyComp, Comp, GameObj, PosComp, Vec2 } from "kaplay"
import { K } from "../init"
import { SpringComp } from "../plugins/kaplay-springs"

export interface TailComp extends Comp {
    readonly topPos: Vec2;
    restore2Pos(): void
}

export function tail(start: GameObj<PosComp>, startPos: Vec2): TailComp {
    return {
        id: "tail",
        require: ["pos", "spring"],
        get topPos() {
            return start.toWorld(startPos);
        },
        restore2Pos(this: GameObj<TailComp | PosComp | SpringComp | BodyComp>) {
            this.pos = this.topPos;
            this.vel = K.vec2(0);
        },
        fixedUpdate(this: GameObj<PosComp | TailComp>) {
            if (isNaN(this.pos.x)
                || isNaN(this.pos.y)
                || this.pos.dist(this.topPos) > Math.max(K.width(), K.height())) {
                console.log("found NaN in tail");
                this.restore2Pos();
            }
        }
    }
}
