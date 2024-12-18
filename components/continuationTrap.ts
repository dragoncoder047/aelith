import { AreaComp, BodyComp, CircleComp, Color, Comp, GameObj, NamedComp, OpacityComp, OutlineComp, PosComp, ShaderComp, SpriteComp, StateComp, Vec2 } from "kaplay";
import trapTypes from "../assets/trapTypes.json" with { type: "json" };
import { SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { continuation } from "../object_factories/continuation";
import { promiseObj } from "../object_factories/promiseObj";
import { player, PlayerInventoryItem } from "../player";
import { CollisionerComp } from "./collisioner";
import { ContinuationComp } from "./continuationCore";
import { controllable, ControllableComp } from "./controllable";
import { InvisibleTriggerComp } from "./invisibleTrigger";
import { LoreComp } from "./lore";
import { PromiseComp } from "./promise";
import { TogglerComp } from "./toggler";
import { zoop, ZoopComp, zoopRadius } from "./zoop";

export type CDEComps =
    | PosComp
    | BodyComp
    | CollisionerComp
    | TogglerComp
    | InvisibleTriggerComp
    | StateComp
    | AreaComp;

export type ContinuationDataEntry = {
    obj: GameObj<CDEComps>
    inPlayerInventory: boolean
    pos?: Vec2
    togglerState?: boolean
    triggeredState?: boolean
    bugState?: string
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
    readonly shouldShowWillCapture: boolean
    readonly color: Color
    radius: number
    zoop: GameObj<PosComp | CircleComp | OutlineComp | ZoopComp>
    prepare(): void
    capture(): void
    peekCapture(): ContinuationData
    getPlayerPosData(): Vec2
    blinkenlights(): void
}

export function trap(soundOnCapture: string): ContinuationTrapComp {
    var blinkTimeout = 0;
    var timer = 0;
    return {
        id: "continuation-trap",
        require: ["sprite", "pos", "named", "shader", "lore"],
        captured: [],
        isPreparing: false,
        radius: 0,
        get data() {
            return (trapTypes as any)[(this as any).name!];
        },
        get enabled() {
            return this.data?.concurrent || this.captured.length === 0
        },
        get color() {
            return K.Color.fromHex(this.data?.color ?? "#ff0000")
        },
        get shouldShowWillCapture() {
            return (this.data?.prepare === "editRadius") ? this.isPreparing : ((this as any) === player.holdingItem);
        },
        zoop: K.add([
            K.pos(),
            K.circle(zoopRadius(Infinity), { fill: false }),
            K.outline(2, K.RED),
            K.layer("ui"),
            zoop(),
        ]),
        add(this: GameObj<ContinuationTrapComp | NamedComp | SpriteComp | LoreComp>) {
            this.use(controllable([{ hint: "" }]));
            this.on("invoke", () => {
                if (this.isPreparing) {
                    if (this.data?.prepare !== "throw")
                        this.capture();
                }
                else this.prepare();
            });
            this.on("modify", (delta: number) => {
                if (this.isPreparing && this.data?.prepare === "editRadius")
                    this.radius = Math.max(0, this.radius + delta);
            });
            this.on("inactive", () => {
                this.zoop.hidden = true;
            });
            K.wait(0.1, () => {
                this.radius = this.data!.radius * TILE_SIZE;
                this.lore = { seen: false, ...this.data!.lore };
            });
        },
        update(this: PlayerInventoryItem & GameObj<SpriteComp | ContinuationTrapComp | NamedComp | ShaderComp | ControllableComp>) {
            if (this === player.holdingItem)
                this.flipX = player.flipX;
            if (this.isPreparing) this.controls[0]!.hint = this.data?.prepareHint!;
            else this.controls[0]!.hint = this.data?.holdTrapHint ?? "&msg.continuation.hint.default";
            this.controls[0]!.styles = [this.name.replace(/[^\w]/g, "")];
            this.controls[0]!.hidden = !this.enabled;

            this.zoop.outline.color = this.color;
            this.zoop.pos = this.getPlayerPosData();
            this.uniform!.u_targetcolor = this.color;

            if (!this.zoop.isZooping) {
                if (this.shouldShowWillCapture
                    && this.radius > 0
                    && player.manpage!.hidden
                    && player.inventory.includes(this as any)) {
                    this.zoop.hidden = false;
                    this.zoop.radius = zoopRadius(this.radius);
                }
                else this.zoop.hidden = true;
            }
            this.blinkenlights();
        },
        prepare(this: GameObj<ContinuationTrapComp | LoreComp> & PromiseComp["controlling"]) {
            if (!this.enabled) return;
            this.isPreparing = true;
            this.radius = this.data!.radius * TILE_SIZE;
            if (!this.data?.prepare) {
                this.capture();
                return;
            }
            if (this.data?.prepare === "throw") {
                // give the player a Promise
                const prom = K.add(promiseObj(this)) as any as PlayerInventoryItem;
                // player.playSound(soundOnCapture);
                player.addToInventory(prom);
            }
        },
        draw(this: GameObj<ContinuationTrapComp | PosComp>) {
            if (this.shouldShowWillCapture) {
                const willCapture = this.peekCapture();
                for (var e of willCapture.objects) {
                    if ((e.obj as any) === this) continue;
                    if ((e.obj as any).has("invisible-trigger")) continue;
                    if (e.inPlayerInventory) continue;
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
            }
        },
        capture(this: GameObj<ContinuationTrapComp | NamedComp | ShaderComp | LoreComp>) {
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
                playerPos: this.getPlayerPosData(),
                capturedRadius: this.radius,
                objects: []
            };
            if (this.radius > 0) {
                // find all the objects
                const circle = new K.Circle(data.playerPos, this.radius);
                const foundObjects = K.get<CDEComps>("machine", { recursive: true })
                    .filter(obj =>
                        ((obj as unknown as GameObj<OpacityComp>).opacity === 0
                            // If opacity is 0, it's a wind tunnel or something else, must use distance to pos
                            // else just let's see if it collides
                            ? undefined
                            : obj.worldArea?.().collides(circle))
                        ?? obj.worldPos()!.dist(data.playerPos) < this.radius)
                    .filter(obj => !obj.is("checkpoint"))
                    .concat(player.inventory.filter(x => x.has("body")) as any);
                for (var obj of foundObjects) {
                    const e: ContinuationDataEntry = {
                        obj,
                        inPlayerInventory: player.inventory.includes(obj as any),
                    };
                    if (obj.has("body") && !obj.isStatic)
                        e.pos = (e.inPlayerInventory ? data.playerPos : obj.pos).clone();
                    if (obj.has("toggler"))
                        e.togglerState = obj.togglerState;
                    if (obj.has("invisible-trigger"))
                        e.triggeredState = obj.triggered;
                    if (obj.has("bug"))
                        e.bugState = obj.state;
                    data.objects.push(e);
                }
            }
            return data;
        },
        getPlayerPosData(this: GameObj<ContinuationComp | PosComp>) {
            return this.data?.prepare === "throw" ? this.worldPos()! : player.worldPos()!;
        },
        inspect() {
            return `enabled: ${this.enabled}, radius: ${this.radius}, preparing: ${this.isPreparing}`;
        },
        blinkenlights(this: GameObj<SpriteComp | ContinuationTrapComp>) {
            var min = 0, max = 0;
            const anim = this.getAnim(this.enabled ? (this.isPreparing ? "armed" : "ready") : "disabled");
            if (anim && typeof anim !== "number") {
                min = anim.from;
                max = anim.to;
            }
            if (!this.enabled) blinkTimeout = 0;
            else if (this.isPreparing) blinkTimeout = 0.4;
            else blinkTimeout = K.rand(0.2, 1);
            if (blinkTimeout > timer) {
                timer += K.dt();
                return;
            }
            timer = 0;
            this.frame = !this.isPreparing ? K.randi(min, max + 1) : (min + (((this.frame + 1) - min) % (max - min + 1)));
        },
    };
}
