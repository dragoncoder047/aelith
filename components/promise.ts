import { AreaComp, BodyComp, Color, Comp, GameObj, KEventController, NamedComp, OffScreenComp, PosComp, ShaderComp } from "kaplay";
import contTypes from "../assets/trapTypes.yaml";
import { SCALE, WALK_SPEED } from "../constants";
import { K } from "../init";
import { splash } from "../misc/particles";
import { style } from "../misc/utils";
import { player } from "../player";
import { ContinuationTrapComp } from "./continuationTrap";
import { InteractableComp } from "./interactable";

export interface PromiseComp extends Comp {
    controlling: GameObj<ContinuationTrapComp | NamedComp | PosComp | OffScreenComp | AreaComp | BodyComp | InteractableComp>
    readonly data: any

    params: ContinuationTrapComp["params"]
    readonly color: Color
    readonly type: string
}

export function promise(controlling: PromiseComp["controlling"], params: ContinuationTrapComp["params"]): PromiseComp {
    var _cre: KEventController;
    var boostMode = false;
    return {
        id: "promise",
        require: ["shader", "interactable"],
        controlling,
        type: controlling.name as string,
        get data() {
            return contTypes[this.type as any as string];
        },
        params,
        get color() {
            return K.Color.fromHex(this.data?.color ?? "#ff0000")
        },
        add(this: GameObj<PromiseComp | ShaderComp | NamedComp | InteractableComp>) {
            if (this.params.pName !== null)
                this.use(K.named(this.params.pName));
            this.action1 = () => {
                player.removeFromInventory(this as any);
                this.destroy();
                this.controlling.gravityScale = 1;
                const temp = this.controlling.params;
                this.controlling.params = this.params;
                this.controlling.capture();
                this.controlling.params = temp;
                return true;
            };
            this.manpage = controlling.manpage;
            if (controlling.data?.flyingEnabled) {
                this.action4 = () => {
                    boostMode = !boostMode;
                    if (boostMode) this.controlling.gravityScale = 0;
                    else this.controlling.gravityScale = 1;
                    return true;
                };
                this.motionHandler = xy => {
                    if (!boostMode) return false;
                    this.controlling.gravityScale = 0;
                    this.controlling.vel = K.vec2(0);
                    if (this.controlling.curPlatform()) this.controlling.jump(1);
                    this.controlling.move(xy.scale(WALK_SPEED));
                    splash(this.controlling.pos, this.controlling.color, 5, -10);
                    return true;
                }
            }
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
        update(this: GameObj<InteractableComp | PromiseComp>) {
            const styles = [this.type.replace(/[^\w]/g, "")];
            const data = {
                flyEnabled: String(this.data?.flyingEnabled),
                flying: String(boostMode),
            };
            const hintsObj = this.data?.hints.promise ?? {};
            this.action1Hint = hintsObj.action1 ? style(K.sub(hintsObj.action1, data), styles) : undefined;
            this.action4Hint = hintsObj.action4 ? style(K.sub(hintsObj.action4, data), styles) : undefined;
            this.moveHint = hintsObj.motion ? style(K.sub(hintsObj.motion, data), styles) : undefined;
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
