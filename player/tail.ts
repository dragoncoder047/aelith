import { BodyComp, Comp, GameObj, PosComp, Vec2 } from "kaplay"
import { K } from "../init"
import { SpringComp } from "../plugins/kaplay-springs"

export interface TailComp extends Comp {
    readonly topPos: Vec2
    restore2Pos(): void
}

export function tail(): TailComp {
    return {
        id: "tail",
        require: ["pos", "spring"],
        get topPos() {
            var top: GameObj<PosComp | SpringComp> = this as any;
            while (top.other?.has("spring"))
                top = top.other as any;
            return top.toWorld(top.actualP2);
        },
        restore2Pos(this: GameObj<TailComp | PosComp | SpringComp | BodyComp>) {
            this.pos = this.topPos.clone();
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
