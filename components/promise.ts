import { Color, Comp, GameObj, NamedComp, OffScreenComp, PosComp, ShaderComp } from "kaplay";
import contTypes from "../assets/trapTypes.json" with { type: "json" };
import { SCALE } from "../constants";
import { K } from "../init";
import { ContinuationTrapComp } from "./continuationTrap";
import { controllable, ControllableComp } from "./controllable";
import { player } from "../player";


export interface PromiseComp extends Comp {
    controlling: GameObj<ContinuationTrapComp | NamedComp | PosComp | OffScreenComp>
    readonly data: (typeof contTypes)[keyof typeof contTypes] | undefined
    readonly color: Color
    readonly type: string
}

export function promise(controlling: PromiseComp["controlling"]): PromiseComp {
    return {
        id: "promise",
        require: ["shader"],
        controlling,
        type: controlling.name,
        get data() {
            return contTypes[this.type as any as keyof typeof contTypes];
        },
        get color() {
            return K.Color.fromHex(this.data?.color ?? "#ff0000")
        },
        add(this: GameObj<PromiseComp | ShaderComp | ControllableComp | NamedComp>) {
            this.use(controllable([{ hint: "&msg.continuation.hint.promise" }]));
            this.controls[0]!.styles = [this.type];
            if (this.data!.pName !== null)
                this.use(K.named(this.data!.pName!));
            this.on("modify", d => this.controlling.trigger("modify", d));
            this.on("invoke", () => {
                player.removeFromInventory(this as any);
                this.destroy();
                this.controlling.capture();
            });
            this.uniform!.u_targetcolor = this.color;
        },
        draw(this: GameObj<PosComp | PromiseComp>) {
            if (this.controlling.hidden) return;
            const p1 = K.vec2(0, 0);
            const p2 = this.fromWorld(this.controlling.worldPos()!);
            if (this.controlling.isOffScreen()) {
                const doubledScreenRect = new K.Rect(K.vec2(-K.width(), -K.height()), K.width() * 2, K.height() * 2);
                const out = new K.Line(K.vec2(), K.vec2());
                const clipped = new K.Line(p1, p2);
                K.clipLineToRect(doubledScreenRect, clipped, out);
                p1.x = out.p1.x;
                p1.y = out.p1.y;
                p2.x = out.p2.x;
                p2.y = out.p2.y;
            }
            K.drawLine({
                p1, p2,
                width: 2 / SCALE,
                opacity: 0.5,
                color: this.color
            });
        }
    }
}
