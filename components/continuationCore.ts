import { Comp, GameObj, NamedComp, OpacityComp, PosComp, ShaderComp, SpriteComp } from "kaplay";
import contTypes from "../assets/trapTypes.json";
import { K } from "../init";
import { player, PlayerInventoryItem } from "../player";
import { ContinuationData } from "./continuationTrap";
import { TILE_SIZE } from "../constants";

export interface ContinuationComp extends Comp {
    type: keyof typeof contTypes
    readonly data: (typeof contTypes)[keyof typeof contTypes] | undefined
    captured: ContinuationData
    worldMarker: GameObj<PosComp | SpriteComp | ShaderComp>
    invoke(): void,
    activate(): void,
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
            K.area(),
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
            this.name = type + " " + K.time().toString(16);
            this.uniform!.u_targetcolor = K.Color.fromHex(this.data?.color ?? "#ff0000");
            this.hidden = true;
            this.worldMarker.hidden = true;
        },
        invoke(this: GameObj<ContinuationComp>) {
            K.debug.log("restore", this.type);
            // do restore of captured data
            const p = player.worldPos()!;
            const delta = this.captured.playerPos.sub(p);
            K.get<PosComp>("tail").forEach(t => t.moveBy(delta));
            player.moveBy(delta);
            player.playSound("teleport");
            // K.camPos(K.camPos().add(delta));
            for (var e of this.captured.objects) {
                player.removeFromInventory(e.obj as unknown as PlayerInventoryItem);
                if (e.obj.is("body") && !e.obj.isStatic) {
                    if (e.obj.pos.dist(this.captured.playerPos) > this.captured.capturedRadius) {
                        // It is out of range, clone it
                        K.debug.log("out of range");
                        e.obj.parent!.add({ ...e.obj, pos: e.pos } as GameObj);
                    } else {
                        // It's still in range, move it
                        K.debug.log("in range");
                        e.obj.pos = e.pos!;
                        // nudge a little to make sure it collides properly
                    }
                }
                e.obj.togglerState = e.togglerState!;
                e.obj.stompedBy = e.stompedBy!;
                K.debug.log("Restored", e.obj.tags, "to", e.togglerState);
            }
            if (!this.data!.reusable) this.destroy();
        },
        destroy(this: PlayerInventoryItem & GameObj<ContinuationComp>) {
            player.removeFromInventory(this);
            this.worldMarker.destroy();
        },
        activate(this: GameObj<OpacityComp | ContinuationComp>) {
            this.worldMarker.hidden = this.hidden = false;
        }
    };
}