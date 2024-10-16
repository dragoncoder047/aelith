import { Comp, GameObj, NamedComp, OpacityComp, PosComp, ShaderComp, SpriteComp } from "kaplay";
import contTypes from "../assets/trapTypes.json";
import { K } from "../init";
import { player, PlayerInventoryItem } from "../player";
import { ContinuationData } from "./continuationTrap";

export interface ContinuationComp extends Comp {
    type: keyof typeof contTypes
    readonly data: (typeof contTypes)[keyof typeof contTypes] | undefined
    captured: ContinuationData
    worldMarker: GameObj<PosComp | SpriteComp | ShaderComp>
    invoke(): void,
    activate(): void,
}

const indexMap = new Map<number, number>();
const counterMap = new Map<string, number>();
function getIndex(obj: GameObj<ContinuationComp>): number {
    if (indexMap.has(obj.id!)) return indexMap.get(obj.id!)!;
    var counter = counterMap.get(obj.type) ?? 0;
    counter++;
    counterMap.set(obj.type, counter);
    indexMap.set(obj.id!, counter);
    return counter;
}

export function continuationCore(
    type: keyof typeof contTypes,
    captured: ContinuationData
): ContinuationComp {
    return {
        id: "continuation",
        require: ["sprite", "pos", "shader", "named"],
        type,
        captured,
        worldMarker: K.add([
            K.sprite("continuation", { anim: "spin" }),
            K.pos(captured.playerPos),
            K.layer("continuations"),
            K.anchor("center"),
            K.area({ collisionIgnore: ["*"] }),
            K.shader("recolor-red", {
                u_targetcolor: K.Color.fromHex(contTypes[type].color),
            }),
            "worldMarker",
        ]),
        get data() {
            return contTypes[this.type];
        },
        add(this: GameObj<ContinuationComp | NamedComp | ShaderComp>) {
            this.on("invoke", () => this.invoke());
            this.name = type + "(" + getIndex(this) + ")";
            this.uniform!.u_targetcolor = K.Color.fromHex(this.data?.color ?? "#ff0000");
            this.hidden = true;
            this.worldMarker.hidden = true;
        },
        invoke(this: GameObj<ContinuationComp>) {
            // do restore of captured data
            const p = player.worldPos()!;
            const delta = this.captured.playerPos.sub(p);
            K.get<PosComp>("tail").forEach(t => t.pos = this.captured.playerPos);
            player.moveBy(delta);
            player.playSound("teleport");
            // K.camPos(K.camPos().add(delta));
            for (var e of this.captured.objects) {
                player.removeFromInventory(e.obj as unknown as PlayerInventoryItem);
                if (e.obj.is("body") && !e.obj.isStatic) {
                    if (e.obj.pos.dist(this.captured.playerPos) > this.captured.capturedRadius) {
                        // It is out of range, clone it
                        e.obj.parent!.add({
                            ...e.obj,
                            pos: e.pos,
                            parent: undefined, // this obj is getting a new parent
                        } as unknown as GameObj);
                    } else {
                        // It's still in range, move it
                        e.obj.pos = e.pos!;
                        e.obj.vel = K.vec2(0);
                    }
                }
                e.obj.togglerState = e.togglerState!;
                e.obj.triggered = e.triggeredState!;
                // If it is a button that *was* stomped by a box when captured, but
                // isn't stomped currently, the following happens when the continuation is
                // invoked:
                // 1. The box is moved back, so that it is colliding with the button.
                // 2. The button state is surreptitiously restored by the continuation.
                // 3. On the next frame, the button notices that it got stomped, and toggles
                //    state - turning off wrongly.
                // To prevent #3 from occuring, the button is told to ignore collisions for
                // 5 physics frames (0.1 seconds) after being restored.
                if (e.obj.is("button"))
                    e.obj.ignoreCollisionsFrames = 5;
            }
            if (!this.data!.reusable) this.destroy();
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