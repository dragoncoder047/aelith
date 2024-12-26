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
    objects: ContinuationDataEntry[]
    params: ContinuationTrapComp["params"]
};

export interface ContinuationTrapComp extends Comp {
    isDeferring: boolean
    captured: GameObj<ContinuationComp>[]
    readonly data: (typeof trapTypes)[keyof typeof trapTypes] | undefined
    readonly enabled: boolean
    readonly behavior: (typeof trapTypes)[keyof typeof trapTypes]["behavior"] | undefined
    params: (typeof trapTypes)[keyof typeof trapTypes]["behavior"]
    readonly color: Color
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
        isDeferring: false,
        params: {
            radius: 0,
            deferred: false,
            useSelfPosition: false,
            recapture: true,
            reverseTeleport: false,

            // not editable
            concurrent: false,
            reusable: false,
            editable: false,
        },
        get data() {
            return (trapTypes as any)[(this as any).name!];
        },
        get enabled() {
            return this.behavior?.concurrent || this.captured.length === 0
        },
        get color() {
            return K.Color.fromHex(this.data?.color ?? "#ff0000")
        },
        get behavior() {
            return this.data?.behavior;
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
                if (!this.params.deferred || !this.isDeferring) this.prepare();
            });
            // TODO: rework this mess
            this.on("modify", (delta: number) => {
                if (this.behavior?.editable)
                    this.params.radius = Math.max(0, this.params.radius + delta);
            });
            this.on("inactive", () => {
                this.zoop.hidden = true;
            });
            K.wait(0.1, () => {
                Object.assign(this.params, this.behavior);
                this.params.radius = this.params.radius * TILE_SIZE;
                this.lore = { seen: false, ...this.data!.lore };
            });
        },
        update(this: PlayerInventoryItem & GameObj<SpriteComp | ContinuationTrapComp | NamedComp | ShaderComp | ControllableComp>) {
            if (this === player.holdingItem)
                this.flipX = player.flipX;
            this.controls[0]!.hint = K.sub(
                this.data!.hint ?? "&msg.continuation.hint.default",
                {
                    which: "trap",
                    isDeferring: String(this.isDeferring),
                    willDefer: String(this.params.deferred),
                });
            this.controls[0]!.styles = [this.name.replace(/[^\w]/g, "")];
            this.controls[0]!.hidden = !this.enabled;

            this.zoop.outline.color = this.color;
            this.zoop.pos = this.getPlayerPosData();
            this.uniform!.u_targetcolor = this.color;

            if (!this.zoop.isZooping) {
                if (this.params.radius > 0
                    && player.manpage!.hidden
                    && player.inventory.includes(this)) {
                    this.zoop.hidden = false;
                    this.zoop.radius = zoopRadius(this.params.radius);
                }
                else this.zoop.hidden = true;
            }
            this.blinkenlights();
        },
        prepare(this: GameObj<ContinuationTrapComp | LoreComp> & PromiseComp["controlling"]) {
            if (!this.enabled) return;
            this.isDeferring = true;
            if (this.params.deferred) {
                // give the player a Promise
                const prom = K.add(promiseObj(this)) as any as PlayerInventoryItem;
                // player.playSound(soundOnCapture);
                player.addToInventory(prom);
            } else this.capture();
        },
        draw(this: GameObj<ContinuationTrapComp | PosComp>) {
            if (this.params.radius > 0 && player.inventory.includes(this as any)) {
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
            this.isDeferring = false;
            if (!this.enabled) return;
            const data = this.peekCapture();
            const cont = K.add(continuation(this.name! as any, data, this)) as unknown as (PlayerInventoryItem & GameObj<ContinuationComp>);
            this.captured.push(cont);
            cont.onDestroy(() => this.captured.splice(this.captured.indexOf(cont), 1));
            player.playSound(soundOnCapture);
            this.zoop.radius = zoopRadius(this.params.radius);
            this.zoop.zoop().then(() => {
                player.addToInventory(cont);
                cont.activate();
                player.trigger("getContinuation");
            });
        },
        peekCapture(this: GameObj<ContinuationTrapComp | PosComp>): ContinuationData {
            // Capture all of the objects
            const data: ContinuationData = {
                playerPos: this.getPlayerPosData(),
                params: Object.assign({}, this.params),
                objects: []
            };
            if (this.params.radius > 0) {
                // find all the objects
                const circle = new K.Circle(data.playerPos, this.params.radius);
                const foundObjects = K.get<CDEComps>("machine", { recursive: true })
                    .filter(obj =>
                        ((obj as unknown as GameObj<OpacityComp>).opacity === 0
                            // If opacity is 0, it's a wind tunnel or something else, must use distance to pos
                            // else just let's see if it collides
                            ? undefined
                            : obj.worldArea?.().collides(circle))
                        ?? obj.worldPos()!.dist(data.playerPos) < this.params.radius)
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
        getPlayerPosData(this: GameObj<ContinuationTrapComp | PosComp>) {
            return this.params.useSelfPosition ? this.worldPos()! : player.worldPos()!;
        },
        inspect() {
            return `enabled: ${this.enabled}, radius: ${this.params.radius}, preparing: ${this.isDeferring}`;
        },
        blinkenlights(this: GameObj<SpriteComp | ContinuationTrapComp>) {
            var min = 0, max = 0;
            const anim = this.getAnim(this.enabled ? (this.isDeferring ? "armed" : "ready") : "disabled");
            if (anim && typeof anim !== "number") {
                min = anim.from;
                max = anim.to;
            }
            if (!this.enabled) blinkTimeout = 0;
            else if (this.isDeferring) blinkTimeout = 0.4;
            else blinkTimeout = K.rand(0.2, 1);
            if (blinkTimeout > timer) {
                timer += K.dt();
                return;
            }
            timer = 0;
            this.frame = !this.isDeferring ? K.randi(min, max + 1) : (min + (((this.frame + 1) - min) % (max - min + 1)));
        },
    };
}
