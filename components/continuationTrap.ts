import { AreaComp, BodyComp, CircleComp, Color, ColorComp, Comp, GameObj, NamedComp, OutlineComp, PosComp, ShaderComp, SpriteComp, TextComp, Vec2 } from "kaplay";
import { MParser } from "../assets/mparser";
import trapTypes from "../assets/trapTypes.json";
import { SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { continuation } from "../object_factories/continuation";
import { textNote } from "../object_factories/text";
import { player, PlayerInventoryItem } from "../player";
import { DynamicTextComp } from "../plugins/kaplay-dynamic-text";
import { ButtonComp } from "./button";
import { ContinuationComp } from "./continuationCore";
import { InvisibleTriggerComp } from "./invisibleTrigger";
import { TogglerComp } from "./toggler";
import { zoop, ZoopComp, zoopRadius } from "./zoop";


export type CDEComps =
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
    readonly shouldShowWillCapture: boolean
    readonly color: Color
    radius: number
    hint: GameObj<TextComp | ColorComp | DynamicTextComp | PosComp>
    zoop: GameObj<PosComp | CircleComp | OutlineComp | ZoopComp>
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
        get shouldShowWillCapture() {
            return (this.data?.prepare === "editRadius") ? this.isPreparing : ((this as any) === player.holdingItem);
        },
        hint: K.add([
            K.pos(),
            ...textNote(),
            K.anchor("center"),
            K.color(K.RED),
        ]) as ContinuationTrapComp["hint"],
        zoop: K.add([
            K.pos(),
            K.circle(zoopRadius(Infinity),
                // CircleCompOpt is not in signature for some reason
                // @ts-expect-error
                { fill: false }),
            // TODO: why is this circle always white?
            K.outline(2, K.RED),
            K.layer("ui"),
            zoop(),
        ]),
        add(this: GameObj<ContinuationTrapComp | NamedComp>) {
            this.on("invoke", () => {
                if (this.isPreparing) this.capture();
                else this.prepare();
            });
            this.on("modify", (delta: number) => {
                if (this.isPreparing && this.data?.prepare === "editRadius")
                    this.radius = Math.max(0, this.radius + delta);
            });
            this.on("thrown", () => {
                this.isPreparing = false;
            });
            this.hint.t = "";
            K.wait(0.1, () => this.radius = this.data!.radius * TILE_SIZE);
        },
        update(this: PlayerInventoryItem & GameObj<SpriteComp | ContinuationTrapComp | NamedComp | ShaderComp>) {
            const p = (a: string) => { if (this.hasAnim(a) && this.getCurAnim()?.name !== a) this.play(a); }
            if (this.enabled) p("ready");
            else p("disabled");

            if (this.data?.prepare === "throw") {
                if (!this.isPreparing) {
                    if (this === player.holdingItem)
                        this.flipX = player.flipX;
                    if (!this.is("throwable")) this.use("throwable");
                }
                else if (this.isPreparing) {
                    if (this.is("throwable")) this.unuse("throwable");
                }
            } else if (this === player.holdingItem)
                this.flipX = player.flipX;

            if (this.enabled && this === player.holdingItem) {
                if (this.isPreparing) this.hint.t = this.data?.prepareHint!;
                else this.hint.t = this.data?.holdTrapHint ?? "&msg.continuation.hint.default";
            } else this.hint.t = "";

            this.hint.color = this.color.lighten(100);
            this.hint.pos = player.worldPos()!.add(0, TILE_SIZE * 2);
            this.hint.data.radius = this.radius.toString();
            this.zoop.outline.color = this.color;
            this.zoop.pos = this.worldPos()!;
            this.uniform!.u_targetcolor = this.color;

            if (this.shouldShowWillCapture) {
                if (this.radius > 0 && !this.zoop.isZooping) {
                    this.zoop.hidden = false;
                    this.zoop.radius = zoopRadius(this.radius);
                }
            }
            else if (!this.zoop.isZooping) {
                this.zoop.hidden = true;
            }
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
            }
        },
        draw(this: GameObj<ContinuationTrapComp | PosComp>) {
            if (this.shouldShowWillCapture) {
                const willCapture = this.peekCapture();
                for (var e of willCapture.objects) {
                    if ((e.obj as any) === this) continue;
                    if ((e.obj as any).is("invisible-trigger")) continue;
                    const bbox = e.obj.worldArea?.().bbox();
                    if (bbox)
                        K.drawRect({
                            fill: false,
                            color: this.color,
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
                if (this.radius > 0 && !this.zoop.isZooping) {
                    this.zoop.hidden = false;
                    this.zoop.radius = zoopRadius(this.radius);
                }
            }
            else if (!this.zoop.isZooping) {
                this.zoop.hidden = true;
            }
        },
        capture(this: GameObj<ContinuationTrapComp | NamedComp | ShaderComp>) {
            this.isPreparing = false;
            if (!this.enabled) return;
            const data = this.peekCapture();
            const cont = K.add(continuation(this.name! as any, data, this)) as unknown as (PlayerInventoryItem & GameObj<ContinuationComp>);
            this.captured.push(cont);
            cont.onDestroy(() => this.captured.splice(this.captured.indexOf(cont), 1));
            player.playSound(soundOnCapture);
            this.zoop.radius = zoopRadius(this.radius);
            this.zoop.zoop().then(() => {
                player.addToInventory(cont);
                cont.activate();
            });
        },
        peekCapture(this: GameObj<ContinuationTrapComp | PosComp>): ContinuationData {
            // Capture all of the objects
            const data: ContinuationData = {
                playerPos: (this.data?.prepare === "throw" ? this.worldPos()! : player.worldPos()!),
                capturedRadius: this.radius,
                objects: []
            };
            if (this.radius > 0) {
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
            }
            return data;
        },
        inspect() {
            return `enabled: ${this.enabled}, radius: ${this.radius}, preparing: ${this.isPreparing}`;
        }
    };
}
