import { Comp, GameObj, NamedComp, ShaderComp, SpriteComp } from "kaplay";
import trapTypes from "../assets/trapTypes.json"
import { player, PlayerInventoryItem } from "../player";
import { K } from "../init";

export interface ContinuationTrapComp extends Comp {
    isPreparing: boolean
    readonly data: (typeof trapTypes)[keyof typeof trapTypes] | undefined
    readonly enabled: boolean
    radius: number
    prepare(): void
    capture(): void
    captured: undefined[]
}

export function trap(): ContinuationTrapComp {
    return {
        id: "continuation-trap",
        require: ["sprite", "pos", "body", "named", "shader"],
        captured: [],
        isPreparing: false,
        radius: 0,
        get data() {
            return (trapTypes as any)[(this as any).name!];
        },
        get enabled() {
            return this.data?.concurrent || this.captured.length === 0
        },
        add(this: GameObj<ContinuationTrapComp | NamedComp>) {
            this.on("invoke", () => {
                if (this.isPreparing || !this.data?.prepare) {
                    this.isPreparing = false;
                    this.capture();
                } else if (this.enabled) {
                    this.isPreparing = true;
                    this.prepare();
                }
            });
        },
        update(this: PlayerInventoryItem & GameObj<SpriteComp | ContinuationTrapComp | NamedComp | ShaderComp>) {
            if (this === player.holdingItem) {
                this.flipX = player.flipX;
            }
            if (this.enabled) {
                if (this.isPreparing) this.play("ready");
                else this.play("idle");
            } else this.play("disabled");
            this.uniform!.u_targetcolor = K.Color.fromHex(this.data?.color || "#ff0000");
        },
        prepare(this: GameObj<ContinuationTrapComp | NamedComp>) {
            K.debug.log("prepare", this.name);
        },
        capture(this: GameObj<ContinuationTrapComp | NamedComp>) {
            K.debug.log("capture!!", this.name);
        }
    };
}
