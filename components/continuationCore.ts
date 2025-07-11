import { BodyComp, Color, Comp, GameObj, NamedComp, OffScreenComp, OpacityComp, PosComp, RotateComp, ShaderComp, SpriteComp, Tag } from "kaplay";
import contTypes from "../assets/trapTypes.yaml" with { type: "json" };
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
    type: string
    trappedBy: GameObj//<ContinuationTrapComp>
    readonly params: ContinuationTrapComp["params"];
    readonly color: Color
    captured: WorldSnapshot
    worldMarker: GameObj<PosComp | SpriteComp | ShaderComp | OffScreenComp>
    invoke(): void,
    activate(): void,
    emoTimer: number,
}

const EMOS = ["stand", "shy", "oops", "slit_eyes", "ooo", "hi"];

export function continuationCore(
    type: string,
    captured: WorldSnapshot,
    trap: GameObj<ContinuationTrapComp>
): ContinuationComp {
    return {
        id: "continuation",
        require: ["sprite", "pos", "shader", "named", "body"],
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
                u_targetcolor: K.Color.fromHex((contTypes[type] as any).color ?? "#ff0000"),
            }),
            "worldMarker" as Tag,
            "raycastIgnore" as Tag,
        ]),
        get params() {
            return this.captured.restoreParams!;
        },
        get color() {
            return K.Color.fromHex((contTypes[this.type] as any).color ?? "#ff0000")
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
        emoTimer: 0,
        update(this: GameObj<BodyComp | SpriteComp | ContinuationComp | ControllableComp>) {
            this.controls[0]!.hint = K.sub(
                (contTypes[this.type] as any).hint ?? "&msg.ctlHint.continuation.invoke.default",
                {
                    which: "continuation",
                });
            this.emoTimer -= K.dt();
            if (this.emoTimer <= 0) {
                this.emoTimer = K.rand(0, 5);
                if (K.randi() == 0) {
                    this.play(K.choose(EMOS));
                } else {
                    this.flipX = K.randi() == 0;
                    if (K.randi(3) == 0) {
                        this.jump();
                        this.applyImpulse(K.vec2(this.jumpForce / 2 * (this.flipX ? -1 : 1), 0));
                    }
                }
            }
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
            K.pushRotate(this.angle);
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