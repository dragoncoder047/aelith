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
import { splash } from "../particles";
import { drawZapLine } from "../utils";

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
            // do restore of captured data
            const p = player.worldPos()!;
            const delta = this.captured.playerPos.sub(p);
            const reverseDelta = K.vec2(0);

            if (this.params.recapture) {
                // Capture a continuation from right here so the player can go back.
                const temp = (this.trappedBy as GameObj<ContinuationTrapComp>).params;
                this.trappedBy.params = this.params;
                this.trappedBy.capture();
                this.trappedBy.params = temp;
            }

            if (this.params.reverseTeleport) {
                // do move
                reverseDelta.x = -delta.x;
                reverseDelta.y = -delta.y;
                // don't move
                delta.x = delta.y = 0;
            }


            if (!delta.isZero()) {
                player.moveBy(delta);
                player.head!.moveBy(delta);
                player.vel = K.vec2(0);
                K.get<TailComp>("tail").forEach(t => t.restore2Pos());
                K.setCamPos(K.getCamPos().add(delta));
            }
            player.playSound("teleport");
            player.trigger("teleport");
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
                if (!e.inPlayerInventory) {
                    player.removeFromInventory(obj as any);
                    const off = typeof (obj as any).isOffScreen === "function" ? (obj as any).isOffScreen() : false;
                    if (!off && (obj.has("toggler") || obj.has("bug")) && (obj.has("body") || obj.is("interactable"))) {
                        splash(obj.pos, this.color, undefined, undefined, obj.tags.filter(x => x != "*"));
                    }
                }
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
            if (this.params.oneshot) this.destroy();
            splash(player.pos, this.color);
        },
        draw(this: GameObj<PosComp | ContinuationComp | RotateComp>) {
            if (this.params.reverseTeleport) return;
            K.pushRotate(-this.angle);
            drawZapLine(K.vec2(0), this.fromWorld(this.worldMarker.worldPos()!), { opacity: 0.5, width: 1 / SCALE, color: this.color });
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