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
        update(this: GameObj<PosComp | TailComp>) {
            if (isNaN(this.pos.x) || isNaN(this.pos.y))
                this.restore2Pos();
        }
    }
}
