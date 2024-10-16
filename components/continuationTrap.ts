import { AreaComp, BodyComp, CircleComp, Color, ColorComp, Comp, GameObj, NamedComp, PosComp, ShaderComp, SpriteComp, TextComp, Vec2 } from "kaplay";
import { MParser } from "../assets/mparser";
import trapTypes from "../assets/trapTypes.json";
import { SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { continuation } from "../object_factories/continuation";
import { textNote } from "../object_factories/text";
import { player, PlayerInventoryItem } from "../player";
import { ButtonComp } from "./button";
import { ContinuationComp } from "./continuationCore";
import { DynamicTextComp } from "./dynamicText";
import { InvisibleTriggerComp } from "./invisibleTrigger";
import { TogglerComp } from "./toggler";


type CDEComps =
    | PosComp
    | BodyComp
    | ButtonComp
    | TogglerComp
    | InvisibleTriggerComp
    | AreaComp;

export type ContinuationDataEntry = {
    obj: GameObj<CDEComps>
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
    readonly dontMoveToPlayer: boolean
    readonly color: Color
    radius: number
    hint: GameObj<TextComp | ColorComp | DynamicTextComp | PosComp> | undefined
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
        get dontMoveToPlayer() {
            return this.isPreparing && this.data?.prepare === "throw";
        },
        get color() {
            return K.Color.fromHex(this.data?.color ?? "#ff0000")
        },
        hint: undefined,
        add(this: GameObj<ContinuationTrapComp | NamedComp>) {
            this.on("invoke", () => {
                if (this.isPreparing) this.capture();
                else this.prepare();
            });
            this.on("modify", (delta: number) => {
                if (this.isPreparing && this.data?.prepare === "editRadius")
                    this.radius += delta;
            });
            this.hint = K.add([
                K.pos(),
                ...textNote(),
                K.anchor("center"),
                K.color(this.color),
            ]) as ContinuationTrapComp["hint"];
            this.hint!.t = "";
        },
        update(this: PlayerInventoryItem & GameObj<SpriteComp | ContinuationTrapComp | NamedComp | ShaderComp>) {
            if (this.data === undefined)
                throw (`BUG: Continuation trap was not initialized!\n`
                    + `world.txt location: line ${Math.round(this.pos.y / TILE_SIZE) + 1}, `
                    + `col ${Math.round(this.pos.x / TILE_SIZE) + 1}`);
            if (this === player.holdingItem)
                this.flipX = player.flipX;
            const p = (a: string) => { if (this.hasAnim(a) && this.getCurAnim()?.name !== a) this.play(a); }
            if (this.enabled) {
                if (this.isPreparing) p("ready");
                else p("idle");
            } else p("disabled");
            this.uniform!.u_targetcolor = this.color;
            if (this.data?.prepare === "throw") {
                if (!this.isPreparing && !this.is("throwable")) this.use("throwable");
                else if (this.isPreparing && this.is("throwable")) this.unuse("throwable");
            }
            if (this.enabled && this === player.holdingItem) {
                if (this.isPreparing) this.hint!.t = this.data?.prepareHint!;
                else this.hint!.t = this.data?.holdTrapHint ?? "&msg.continuation.hint.default";
            } else this.hint!.t = "";
            this.hint!.color = this.color;
            this.hint!.pos = player.worldPos()!.add(0, TILE_SIZE * 2);
        },
        prepare(this: GameObj<ContinuationTrapComp | NamedComp | BodyComp>) {
            if (!this.enabled) return;
            this.isPreparing = true;
            this.radius = this.data!.radius * TILE_SIZE;
            if (!this.data?.prepare) {
                this.capture();
                return;
            }
            if (this.data?.prepare === "throw") {
                // if we get in this function, I am selected
                this.applyImpulse(player.throwImpulse!);
                // K.wait(1, () => K.debug.paused = true);
            }
        },
        draw(this: GameObj<ContinuationTrapComp | PosComp>) {
            if (this.isPreparing) {
                if (this.data?.prepare === "editRadius") {
                    const willCapture = this.peekCapture();
                    for (var e of willCapture.objects) {
                        const bbox = e.obj.worldArea().bbox();
                        K.drawRect({
                            fill: false,
                            width: bbox.width,
                            height: bbox.height,
                            pos: this.fromWorld(bbox.pos),
                            outline: {
                                width: 2 / SCALE,
                                color: this.color,
                                opacity: K.wave(0, 1, K.time() * Math.PI * 2),
                                join: "miter",
                            }
                        });
                    }
                }
            }
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
                K.outline(2, this.color),
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
        peekCapture(this: GameObj<ContinuationTrapComp | PosComp>): ContinuationData {
            // Capture all of the objects
            const data: ContinuationData = {
                playerPos: (this.data?.prepare === "throw" ? this.worldPos()! : player.worldPos()!),
                capturedRadius: this.radius,
                objects: []
            };
            // find all the objects
            const foundObjects = MParser.world!.get<CDEComps>("machine")
                .filter(obj => obj.worldPos()!.dist(data.playerPos) <= this.radius);
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
        },
        inspect() {
            return `enabled: ${this.enabled}, radius: ${this.radius}, preparing: ${this.isPreparing}`;
        }
    };
}
