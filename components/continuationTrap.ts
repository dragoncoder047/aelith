import { Comp, GameObj, NamedComp, ShaderComp, SpriteComp, Vec2 } from "kaplay";
import trapTypes from "../assets/trapTypes.json"
import { player, PlayerInventoryItem } from "../player";
import { K } from "../init";

export type ContinuationData = {
    playerPos: Vec2,
    capturedRadius: number,
    objects: {
        objID: number,
        pos?: Vec2,
        toggleState?: boolean
    }[],
};

export interface ContinuationTrapComp extends Comp {
    isPreparing: boolean
    readonly data: (typeof trapTypes)[keyof typeof trapTypes] | undefined
    readonly enabled: boolean
    radius: number
    prepare(): void
    capture(): void
    captured: undefined[]
}

export function trap(soundOnCapture: string): ContinuationTrapComp {
    return {
        id: "continuation-trap",
        require: ["sprite", "pos", "named", "shader"],
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
                if (!this.isPreparing && this.data?.prepare)
                    this.prepare();
                else this.capture();
            });
        },
        update(this: PlayerInventoryItem & GameObj<SpriteComp | ContinuationTrapComp | NamedComp | ShaderComp>) {
            if (this === player.holdingItem)
                this.flipX = player.flipX;
            const p = (a: string) => { if (this.hasAnim(a) && this.getCurAnim()?.name !== a) this.play(a); }
            if (this.enabled) {
                if (this.isPreparing) p("ready");
                else p("idle");
            } else p("disabled");
            this.uniform!.u_targetcolor = K.Color.fromHex(this.data?.color ?? "#ff0000");
        },
        prepare(this: GameObj<ContinuationTrapComp | NamedComp>) {
            if (!this.enabled) return;
            this.isPreparing = true;
            K.debug.log("prepare", this.name, this.data?.prepare);
        },
        capture(this: GameObj<ContinuationTrapComp | NamedComp>) {
            this.isPreparing = false;
            if (!this.enabled) return;
            K.debug.log("capture!!", this.name);
            player.playSound(soundOnCapture);
        }
    };
}
