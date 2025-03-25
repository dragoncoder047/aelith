import { AreaComp, BodyComp, Color, Comp, GameObj, KEventController, NamedComp, OffScreenComp, PosComp, ShaderComp } from "kaplay";
import contTypes from "../assets/trapTypes.json" with { type: "json" };
import { SCALE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { ContinuationTrapComp } from "./continuationTrap";
import { controllable, ControllableComp } from "./controllable";


export interface PromiseComp extends Comp {
    controlling: GameObj<ContinuationTrapComp | NamedComp | PosComp | OffScreenComp | AreaComp | BodyComp>
    readonly data: (typeof contTypes)[keyof typeof contTypes] | undefined

    params: ContinuationTrapComp["params"]
    readonly color: Color
    readonly type: keyof typeof contTypes
}

export function promise(controlling: PromiseComp["controlling"], params: ContinuationTrapComp["params"]): PromiseComp {
    var _cre: KEventController;
    return {
        id: "promise",
        require: ["shader"],
        controlling,
        type: controlling.name as keyof typeof contTypes,
        get data() {
            return contTypes[this.type as any as keyof typeof contTypes];
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
            _cre = this.controlling.onCollide((_, col) => {
                // prevent spurious trigger when it is first thrown, or with non-colliding objects like ladders
                if (player.inventory.includes(this.controlling as any)
                    || (this.controlling as any).platformIgnore.has(player)
                    || [...(col?.target.collisionIgnore ?? [])].some((t: string) => this.is(t))
                    || (col?.target && !col.target.has("body"))) return;
                player.trigger("remoteSense", col?.normal, this.controlling);
            }) as unknown as KEventController; // because types are wrong. kaplayjs/kaplay#577
        },
        update(this: GameObj<ControllableComp | PromiseComp>) {
            this.controls[0]!.hint = K.sub(
                contTypes[this.type].hint ?? "&msg.ctlHint.continuation.invoke.default",
                {
                    which: "promise",
                });
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
        },
        destroy() {
            _cre?.cancel();
        },
    }
}
