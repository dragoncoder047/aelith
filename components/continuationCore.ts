import { Color, Comp, GameObj, NamedComp, OffScreenComp, OpacityComp, PosComp, RotateComp, ShaderComp, SpriteComp, Tag } from "kaplay";
import contTypes from "../assets/trapTypes.json" with { type: "json" };
import { SCALE } from "../constants";
import { K } from "../init";
import { WorldManager } from "../levels";
import { drawZapLine } from "../misc/utils";
import { player } from "../player";
import { PlayerInventoryItem } from "../player/body";
import { StateManager } from "../save_state";
import { WorldSnapshot } from "../save_state/state";
import { ContinuationTrapComp } from "./continuationTrap";
import { controllable, ControllableComp } from "./controllable";

export interface ContinuationComp extends Comp {
    timestamp: number
    type: keyof typeof contTypes
    trappedBy: GameObj//<ContinuationTrapComp>
    readonly params: ContinuationTrapComp["params"];
    readonly color: Color
    captured: WorldSnapshot
    worldMarker: GameObj<PosComp | SpriteComp | ShaderComp | OffScreenComp>
    invoke(): void,
    activate(): void,
}

export function continuationCore(
    type: keyof typeof contTypes,
    captured: WorldSnapshot,
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
            K.tile(),
            K.shader("recolorRed", {
                u_targetcolor: K.Color.fromHex(contTypes[type].color ?? "#ff0000"),
            }),
            "worldMarker" as Tag,
            "raycastIgnore" as Tag,
        ]),
        get params() {
            return this.captured.restoreParams!;
        },
        get color() {
            return K.Color.fromHex(contTypes[this.type].color ?? "#ff0000")
        },
        add(this: GameObj<ContinuationComp | NamedComp | ShaderComp | ControllableComp> & PlayerInventoryItem) {
            this.worldMarker.setParent(WorldManager.activeLevel!.levelObj, { keep: K.KeepFlags.Pos });
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
            if (this.params.recapture) {
                // Capture a continuation from right here so the player can go back.
                const temp = (this.trappedBy as GameObj<ContinuationTrapComp>).params;
                this.trappedBy.params = this.params;
                this.trappedBy.capture();
                this.trappedBy.params = temp;
            }
            if (this.params.oneshot) this.destroy();
            this.trigger("invoked");
            StateManager.restore(this.captured, this.color).then(() => {
                if (this.type === "assert") {
                    // assertion: heal fully
                    player.hp = player.maxHP;
                }
            });
        },
        draw(this: GameObj<PosComp | ContinuationComp | RotateComp>) {
            if (this.params.reverseTeleport || !WorldManager.activeLevel?.levelObj.isAncestorOf(this.worldMarker)) return;
            K.pushRotate(-this.angle);
            drawZapLine(K.vec2(0), this.fromWorld(this.worldMarker.worldPos()!), { width: 2 / SCALE, color: this.color });
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