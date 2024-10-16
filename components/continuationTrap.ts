import { BodyComp, CircleComp, Color, Comp, GameObj, NamedComp, PosComp, ShaderComp, SpriteComp, Vec2 } from "kaplay";
import { MParser } from "../assets/mparser";
import trapTypes from "../assets/trapTypes.json";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { continuation } from "../object_factories/continuation";
import { player, PlayerInventoryItem } from "../player";
import { ContinuationComp } from "./continuationCore";
import { TogglerComp } from "./toggler";
import { ButtonComp } from "./button";
import { InvisibleTriggerComp } from "./invisibleTrigger";


export type ContinuationDataEntry = {
    obj: GameObj<PosComp | BodyComp | ButtonComp | TogglerComp | InvisibleTriggerComp>
    pos?: Vec2
    togglerState?: boolean
    triggeredState?: boolean
};
export type ContinuationData = {
    playerPos: Vec2
    capturedRadius: number
    objects: ContinuationDataEntry[]
};

export interface ContinuationTrapComp extends Comp {
    isPreparing: boolean
    captured: GameObj<ContinuationComp>[]
    readonly data: (typeof trapTypes)[keyof typeof trapTypes] | undefined
    readonly enabled: boolean
    radius: number
    prepare(): void
    capture(): void
    peekCapture(): ContinuationData
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
                if (this.isPreparing) this.capture();
                else this.prepare();
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
            if (this.data?.prepare === "throw") {
                if (this.isPreparing && !this.is("throwable")) this.use("throwable");
                else if (!this.isPreparing && this.is("throwable")) this.unuse("throwable");
            }
        },
        prepare(this: GameObj<ContinuationTrapComp | NamedComp>) {
            if (!this.enabled) return;
            this.isPreparing = true;
            this.radius = this.data!.radius * TILE_SIZE;
            if (!this.data?.prepare) {
                this.capture();
                return;
            }
            if (this.data?.prepare === "throw")
                // if we get in this function, I am selected
                // TODO: this won't work
                player.throw();
        },
        draw() {
            // TODO: draw peekCapture for call/cc
        },
        capture(this: GameObj<ContinuationTrapComp | NamedComp | ShaderComp>) {
            this.isPreparing = false;
            if (!this.enabled) return;
            const data = this.peekCapture();
            const cont = K.add(continuation(this.name! as any, data)) as (PlayerInventoryItem & GameObj<ContinuationComp>);
            this.captured.push(cont);
            cont.onDestroy(() => this.captured.splice(this.captured.indexOf(cont), 1));
            // Add circle effects
            player.playSound(soundOnCapture);
            K.add([
                K.pos(data.playerPos),
                // CircleCompOpt is not in signature for some reason
                K.circle(
                    Math.min(K.vec2(K.width(), K.height()).len() / 2, this.radius),
                    // @ts-expect-error
                    { fill: false }),
                // TODO: why is this circle always white?
                K.outline(2, K.Color.fromHex(this.data?.color ?? "#ff0000")),
                K.layer("ui"),
                {
                    update(this: GameObj<CircleComp>) {
                        // if (this.radius > 100)
                        this.radius -= TILE_SIZE * 25 * K.dt();
                        if (this.radius < 0) {
                            player.addToInventory(cont);
                            cont.activate();
                            this.destroy();
                        }
                    }
                }
            ]);
        },
        peekCapture(): ContinuationData {
            // Capture all of the objects
            const data: ContinuationData = {
                playerPos: player.worldPos()!,
                capturedRadius: this.radius,
                objects: []
            };
            // find all the objects
            const foundObjects = MParser.world!.get<PosComp | BodyComp | TogglerComp | ButtonComp | InvisibleTriggerComp>("machine")
                .filter(obj => obj.worldPos()!.dist(player.worldPos()!) <= this.radius);
            for (var obj of foundObjects) {
                const e: ContinuationDataEntry = { obj };
                if (obj.is("body") && !obj.isStatic)
                    e.pos = obj.pos.clone();
                if (obj.is("toggler"))
                    e.togglerState = obj.togglerState;
                if (obj.is("invisible-trigger"))
                    e.triggeredState = obj.triggered;
                data.objects.push(e);
            }
            console.log(data);
            return data;
        }
    };
}
