import { AreaComp, BodyComp, Color, Comp, GameObj, KEventController, NamedComp, OffScreenComp, PosComp, ShaderComp } from "kaplay";
import contTypes from "../assets/trapTypes.yaml" with { type: "json" };
import { SCALE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { ContinuationTrapComp } from "./continuationTrap";
import { controllable, ControllableComp } from "./controllable";


export interface PromiseComp extends Comp {
    controlling: GameObj<ContinuationTrapComp | NamedComp | PosComp | OffScreenComp | AreaComp | BodyComp>
    readonly data: any

    params: ContinuationTrapComp["params"]
    readonly color: Color
    readonly type: string
}

export function promise(controlling: PromiseComp["controlling"], params: ContinuationTrapComp["params"]): PromiseComp {
    var _cre: KEventController;
    return {
        id: "promise",
        require: ["shader"],
        controlling,
        type: controlling.name as string,
        get data() {
            return contTypes[this.type as any as string];
        },
        params,
        get color() {
            return K.Color.fromHex(this.data?.color ?? "#ff0000")
        },
        add(this: GameObj<PromiseComp | ShaderComp | ControllableComp | NamedComp>) {
            this.use(controllable([{ hint: "" }]));
            this.controls[0]!.styles = [this.type.replace(/[^\w]/g, "")];
            if (this.params.pName !== null)
                this.use(K.named(this.params.pName));
            this.on("modify", d => this.controlling.trigger("modify", d));
            this.on("invoke", () => {
                player.removeFromInventory(this as any);
                this.destroy();
                this.controlling.gravityScale = 1;
                const temp = this.controlling.params;
                this.controlling.params = this.params;
                this.controlling.capture();
                this.controlling.params = temp;
            });
            this.uniform!.u_targetcolor = this.color;
            _cre = (this.controlling as PromiseComp["controlling"]).onCollide((_, col) => {
                // prevent spurious trigger when it is first thrown, or with non-colliding objects like ladders
                if (player.inventory.includes(this.controlling as any)
                    || (this.controlling as any).platformIgnore.has(player)
                    || (col?.target.collisionIgnore ?? []).some((t: string) => this.is(t))
                    || (col?.target && !col.target.has("body"))) return;
                player.trigger("remoteSense", col?.normal, this.controlling);
            })
        },
        update(this: GameObj<ControllableComp | PromiseComp>) {
            this.controls[0]!.hint = K.sub(
                (contTypes[this.type] as any).hint ?? "&msg.ctlHint.continuation.invoke.default",
                {
                    which: "promise",
                });
        },
        draw(this: GameObj<PosComp | PromiseComp>) {
            if (this.controlling.hidden) return;
            const p1 = K.vec2(0, 0);
            const p2 = this.fromWorld(this.controlling.worldPos()!);
            if (this.controlling.isOffScreen()) {
                const screenRect = new K.Rect(K.vec2(-K.width() / 2, -K.height() / 2), K.width(), K.height());
                const out = new K.Line(K.vec2(), K.vec2());
                const clipped = new K.Line(K.toScreen(p1), K.toScreen(p2));
                K.clipLineToRect(screenRect, clipped, out);
                out.p1 = K.toWorld(out.p1);
                out.p2 = K.toWorld(out.p2);
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
        },
        destroy() {
            _cre?.cancel();
        },
    }
}
