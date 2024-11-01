import { Color, Comp, GameObj, NamedComp, OpacityComp, PosComp, ShaderComp, SpriteComp, Tag, OffScreenComp } from "kaplay";
import contTypes from "../assets/trapTypes.json";
import { SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { player, PlayerInventoryItem } from "../player";
import { CDEComps, ContinuationData, ContinuationTrapComp } from "./continuationTrap";
import { CloneableComp } from "./cloneable";

export interface ContinuationComp extends Comp {
    type: keyof typeof contTypes
    trappedBy: GameObj//<ContinuationTrapComp>
    readonly data: (typeof contTypes)[keyof typeof contTypes] | undefined
    readonly color: Color
    captured: ContinuationData
    worldMarker: GameObj<PosComp | SpriteComp | ShaderComp | OffScreenComp>
    invoke(): void,
    activate(): void,
}

const indexMap = new Map<number, number>();
const counterMap = new Map<string, number>();
function getIndex(obj: GameObj<ContinuationComp>): number {
    if (indexMap.has(obj.id!)) return indexMap.get(obj.id!)!;
    const counter = (counterMap.get(obj.type) ?? 0) + 1;
    counterMap.set(obj.type, counter);
    indexMap.set(obj.id!, counter);
    return counter;
}

export function continuationCore(
    type: keyof typeof contTypes,
    captured: ContinuationData,
    trap: GameObj<ContinuationTrapComp>
): ContinuationComp {
    return {
        id: "continuation",
        require: ["sprite", "pos", "shader", "named"],
        type,
        captured,
        trappedBy: trap,
        worldMarker: K.add([
            K.sprite("continuation", { anim: "spin" }),
            K.pos(captured.playerPos),
            K.layer("continuations"),
            K.anchor("center"),
            K.offscreen(),
            K.area(),
            K.shader("recolor-red", {
                u_targetcolor: K.Color.fromHex(contTypes[type].color ?? "#ff0000"),
            }),
            "worldMarker" as Tag,
            "interactable" as Tag,
        ]),
        get data() {
            return contTypes[this.type];
        },
        get color() {
            return K.Color.fromHex(this.data?.color ?? "#ff0000")
        },
        add(this: GameObj<ContinuationComp | NamedComp | ShaderComp> & PlayerInventoryItem) {
            this.on("invoke", () => this.invoke());
            this.name = this.data!.cName;
            this.uniform!.u_targetcolor = this.color;
            this.hidden = true;
            this.worldMarker.hidden = true;
            this.worldMarker.on("interact", () => {
                player.holdingIndex = player.inventory.indexOf(this);
                player.trigger("inventoryChange");
            });
        },
        invoke(this: GameObj<ContinuationComp>) {
            if (this.data?.special === "recapture") {
                // Capture a continuation from right here so the player can go back.
                this.trappedBy.capture();
            }
            // do restore of captured data
            const p = player.worldPos()!;
            const delta = this.captured.playerPos.sub(p);
            K.get<PosComp>("tail").forEach(t => t.pos = this.captured.playerPos);
            player.moveBy(delta);
            player.playSound("teleport");
            // K.camPos(K.camPos().add(delta));
            for (var e of this.captured.objects) {
                if (!e.inPlayerInventory)
                    player.removeFromInventory(e.obj as any);
                else
                    player.addToInventory(e.obj as any);
                var obj = e.obj;
                if (e.obj.is("body") && !e.obj.isStatic) {
                    if (e.obj.pos.dist(this.captured.playerPos) > this.captured.capturedRadius
                        && e.obj.is("cloneable")) {
                        // It is out of range, clone it
                        obj = (e.obj as GameObj<CDEComps | CloneableComp<CDEComps>>).clone();
                        obj.use("machine");
                    }
                    // Update pos and vel
                    obj.pos = e.pos!.clone();
                    obj.vel = K.vec2(0);
                }
                obj.togglerState = e.togglerState!;
                obj.triggered = e.triggeredState!;
                // If it is a button or laser that *was* triggered by a box when captured, but
                // isn't triggered currently, the following happens when the continuation is
                // invoked:
                // 1. The box is moved back, so that it is triggering the button or laser.
                // 2. The button/laser state is surreptitiously restored by the continuation.
                // 3. On the next frame, the button/laser notices that it got triggered, and toggles
                //    state - undoing the continuation invocation.
                // To prevent #3 from occuring, the button/laser is told to ignore new triggers for
                // 5 physics frames (0.1 seconds) after being restored.
                if (obj.is("collisioner"))
                    obj.ignoreTriggerTimeout = 5;
            }
            if (!this.data!.reusable) this.destroy();
        },
        draw(this: GameObj<PosComp | ContinuationComp>) {
            const p1 = K.vec2(0, 0);
            const p2 = this.fromWorld(this.worldMarker.worldPos()!);
            if (this.worldMarker.isOffScreen())  {
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
        },
        destroy(this: PlayerInventoryItem & GameObj<ContinuationComp>) {
            player.removeFromInventory(this);
            this.worldMarker.destroy();
        },
        activate(this: GameObj<OpacityComp | ContinuationComp>) {
            this.worldMarker.hidden = this.hidden = false;
        },
        inspect() {
            return `captured ${this.captured.objects.length} objects`
        }
    };
}