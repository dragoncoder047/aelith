import { Color, Comp, GameObj, NamedComp, OffScreenComp, OpacityComp, PosComp, RotateComp, ShaderComp, SpriteComp, Tag } from "kaplay";
import contTypes from "../assets/trapTypes.json" with { type: "json" };
import { SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { PlayerInventoryItem } from "../player/body";
import { CloneableComp } from "./cloneable";
import { CDEComps, ContinuationData, ContinuationTrapComp } from "./continuationTrap";
import { controllable, ControllableComp } from "./controllable";
import { TailComp } from "../player/tail";

export interface ContinuationComp extends Comp {
    timestamp: number
    type: keyof typeof contTypes
    trappedBy: GameObj//<ContinuationTrapComp>
    readonly params: ContinuationData["params"]
    readonly color: Color
    captured: ContinuationData
    worldMarker: GameObj<PosComp | SpriteComp | ShaderComp | OffScreenComp>
    invoke(): void,
    activate(): void,
}

export function continuationCore(
    type: keyof typeof contTypes,
    captured: ContinuationData,
    trap: GameObj<ContinuationTrapComp>
): ContinuationComp {
    return {
        id: "continuation",
        require: ["sprite", "pos", "shader", "named"],
        timestamp: Date.now(),
        type,
        captured,
        trappedBy: trap,
        worldMarker: K.add([
            K.sprite("continuation_target", { anim: "spin" }),
            K.pos(captured.playerPos),
            K.layer("continuations"),
            K.anchor("center"),
            K.offscreen(),
            K.area(),
            K.shader("recolor-red", {
                u_targetcolor: K.Color.fromHex(contTypes[type].color ?? "#ff0000"),
            }),
            "worldMarker" as Tag,
            "raycastIgnore" as Tag,
        ]),
        get params() {
            return this.captured.params;
        },
        get color() {
            return K.Color.fromHex(contTypes[this.type].color ?? "#ff0000")
        },
        add(this: GameObj<ContinuationComp | NamedComp | ShaderComp | ControllableComp> & PlayerInventoryItem) {
            this.use(controllable([{ hint: "" }]));
            this.controls[0]!.styles = [this.trappedBy.name.replace(/[^\w]/g, "")];
            this.on("invoke", () => this.invoke());
            this.name = this.params.cName;
            this.uniform!.u_targetcolor = this.color;
            this.hidden = true;
            this.paused = true;
            this.worldMarker.hidden = true;
            if (this.params.reverseTeleport) {
                this.worldMarker.destroy();
            }
        },
        update(this: GameObj<ContinuationComp | ControllableComp>) {
            this.controls[0]!.hint = K.sub(
                contTypes[this.type].hint ?? "&msg.ctlHint.continuation.invoke.default",
                {
                    which: "continuation",
                });
        },
        invoke(this: GameObj<ContinuationComp>) {
            if (this.type === "assert") {
                // assertion: heal fully
                player.heal(Infinity);
            }
            if (this.params.recapture) {
                // Capture a continuation from right here so the player can go back.
                this.trappedBy.capture();
            }
            // do restore of captured data
            const p = player.worldPos()!;
            const delta = this.captured.playerPos.sub(p);
            const reverseDelta = K.vec2(0);

            if (this.params.reverseTeleport) {
                // do move
                reverseDelta.x = -delta.x;
                reverseDelta.y = -delta.y;
                // don't move
                delta.x = delta.y = 0;
            }

            player.moveBy(delta);
            if (!delta.isZero()) player.vel = K.vec2(0);
            K.get<TailComp>("tail").forEach(t => t.restore2Pos());
            player.playSound("teleport");
            player.trigger("teleport");
            // K.setCamPos(K.getCamPos().add(delta));
            for (var e of this.captured.objects) {
                var obj = e.obj;
                const canClone = e.obj.has("cloneable");
                const shouldClone = (
                    !this.params.reverseTeleport
                    && (player.inventory.includes(e.obj as any) ? this.captured.playerPos : e.obj.pos)
                        .dist(this.captured.playerPos) > this.params.radius)
                if (e.obj.has("body") && !e.obj.isStatic) {
                    if (shouldClone && canClone) {
                        // It is out of range, clone it
                        obj = (e.obj as GameObj<CDEComps | CloneableComp<CDEComps>>).clone();
                        e.obj.tags.forEach(t => obj.tag(t));
                    }
                    // Update pos and vel
                    obj.pos = e.pos!.add(reverseDelta);
                    obj.vel = K.vec2(0);
                }
                if (e.bugState) obj.enterState(e.bugState);
                obj.togglerState = this.params.fuzzStates ? !obj.togglerState : e.togglerState!;
                obj.triggered = e.triggeredState!;
                if (!e.inPlayerInventory)
                    player.removeFromInventory(obj as any);
                else
                    player.addToInventory(obj as any);
                // If it is a button or laser that *was* triggered by a box when captured, but
                // isn't triggered currently, the following happens when the continuation is
                // invoked:
                // 1. The box is moved back, so that it is triggering the button or laser.
                // 2. The button/laser state is surreptitiously restored by the continuation.
                // 3. On the next frame, the button/laser notices that it got triggered, and toggles
                //    state - undoing the continuation invocation.
                // To prevent #3 from occuring, the button/laser is told to ignore new triggers for
                // 5 physics frames (0.1 seconds) after being restored.
                if (obj.has("collisioner"))
                    obj.ignoreTriggerTimeout = 5;
            }
            if (!this.params.reusable) this.destroy();
        },
        draw(this: GameObj<PosComp | ContinuationComp | RotateComp>) {
            if (this.params.reverseTeleport) return;
            K.pushRotate(-this.angle);
            const p1 = K.vec2(0, 0);
            const p2 = this.fromWorld(this.worldMarker.worldPos()!);
            if (this.worldMarker.isOffScreen()) {
                const doubledScreenRect = new K.Rect(K.vec2(-K.width(), -K.height()), K.width() * 2, K.height() * 2);
                const out = new K.Line(K.vec2(), K.vec2());
                const clipped = new K.Line(p1, p2);
                K.clipLineToRect(doubledScreenRect, clipped, out);
                p1.x = out.p1.x;
                p1.y = out.p1.y;
                p2.x = out.p2.x;
                p2.y = out.p2.y;
            }
            const segments = 8 * p1.sub(p2).len() / TILE_SIZE;
            const jitter = () => K.rand(K.vec2(-2, -2), K.vec2(2, 2));
            const f = (t: number) => K.lerp(p1, p2, t).add(jitter());
            K.drawCurve(f, {
                segments,
                width: 1 / SCALE,
                opacity: 0.5,
                color: this.color
            });
            K.popTransform();
        },
        destroy(this: PlayerInventoryItem & GameObj<ContinuationComp>) {
            player.removeFromInventory(this);
            this.worldMarker.destroy();
        },
        activate(this: GameObj<OpacityComp | ContinuationComp>) {
            this.worldMarker.hidden = this.hidden = false;
            this.paused = false;
        },
        inspect() {
            return `captured ${this.captured.objects.length} objects`
        }
    };
}