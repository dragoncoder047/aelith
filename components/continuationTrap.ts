import { CircleComp, Color, Comp, GameObj, NamedComp, OutlineComp, PosComp, ShaderComp, SpriteComp } from "kaplay";
import trapTypes from "../assets/trapTypes.json" with { type: "json" };
import { SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { WorldManager } from "../levels";
import { splash } from "../misc/particles";
import { continuation } from "../object_factories/continuation";
import { promiseObj } from "../object_factories/promiseObj";
import { player } from "../player";
import { PlayerInventoryItem } from "../player/body";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";
import { PtyMenu } from "../plugins/kaplay-pty";
import { StateManager } from "../save_state";
import { WorldSnapshot } from "../save_state/state";
import { MenuModal, modalmenu } from "../ui/menuFactory";
import { ContinuationComp } from "./continuationCore";
import { controllable, ControllableComp } from "./controllable";
import { LoreComp } from "./lore";
import { PromiseComp } from "./promise";
import { zoop, ZoopComp, zoopRadius } from "./zoop";

export interface ContinuationTrapComp extends Comp {
    isDeferring: boolean
    isConnected: boolean
    captured: GameObj<ContinuationComp>[]
    readonly data: (typeof trapTypes)[keyof typeof trapTypes] | undefined
    readonly enabled: boolean
    readonly behavior: (typeof trapTypes)[keyof typeof trapTypes]["behavior"] | undefined
    params: (typeof trapTypes)[keyof typeof trapTypes]["behavior"]
    readonly color: Color
    zoop: GameObj<PosComp | CircleComp | OutlineComp | ZoopComp>
    _menu: MenuModal
    prepare(): void
    capture(): void
    peekCapture(): WorldSnapshot

    startEditing(): void
    menuUpdate(): void
}

export function continuationTrapCore(soundOnCapture: string): ContinuationTrapComp {
    const switchesMenu: PtyMenu = {
        id: "flags",
        name: "&msg.continuation.edit.flags",
        type: "select",
        multiple: true,
        opts: [
            { text: "--defer", value: "deferred" },
            { text: "--oneshot", value: "oneshot" },
            { text: "--stack-only", value: "useSelfPosition" },
            { text: "--as-coroutine", value: "recapture" },
            { text: "--force-superimpose", value: "reverseTeleport" },
            { text: "--cleanup-subprocesses", value: "destroysObjects" },
            { text: "--fuzz", value: "fuzzStates" },
        ] as { text: string, value: keyof ContinuationTrapComp["params"] }[],
        selected: [],
    };
    const pNameMenu: PtyMenu = {
        id: "--name-of=promise",
        name: "&msg.continuation.edit.pName",
        type: "string",
        value: "",
        prompt: "> ",
        validator: /^[\w\d]+$/,
        invalidMsg: "&msg.continuation.edit.invalidName",
    };
    const cNameMenu: PtyMenu = {
        id: "--name-of=continuation",
        name: "&msg.continuation.edit.cName",
        type: "string",
        value: "",
        prompt: "> ",
        validator: /^[\w\d]+$/,
        invalidMsg: "&msg.continuation.edit.invalidName",
    };
    const topMenu: PtyMenu = {
        id: "agdb config \"&name\"",
        type: "submenu",
        opts: [switchesMenu, cNameMenu, pNameMenu],
    };
    return {
        id: "continuation-trap",
        require: ["sprite", "pos", "named", "shader", "lore"],
        captured: [],
        isDeferring: false,
        isConnected: false,
        params: {
            cName: "{undefined}",
            pName: "{undefined}",
            radius: 0,
            deferred: false,
            oneshot: false,
            useSelfPosition: false,
            recapture: false,
            reverseTeleport: false,
            fuzzStates: false,
            destroysObjects: false,

            // not editable
            concurrent: false,
            editable: false,
            global: false,
            destroyImmune: false,
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
            K.timer(),
        ]),
        _menu: undefined as any,
        add(this: GameObj<ContinuationTrapComp | NamedComp | SpriteComp | LoreComp | PosComp>) {
            this.zoop.hidden = true;
            this.zoop.pos = this.pos;
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
            this.on("thrown", () => {
                if (this.params.deferred && this.isDeferring) {
                    const newHoldingIndex = player.inventory.findLastIndex(i => (i as any).controlling === this);
                    player.scrollInventory(newHoldingIndex - player.holdingIndex);
                }
            });
            this._menu = modalmenu(topMenu, ["menuActive", "contMenu"], "&editMenuCtlHint",
                this.on("edit", () => this._menu.open()) as KEventControllerPatch);
            this._menu.onStart(() => this.startEditing());
            this._menu.onUpdate(() => this.menuUpdate());
            K.wait(0.1, () => {
                Object.assign(this.params, this.behavior);
                this.params.radius = this.params.radius * TILE_SIZE;
                this.lore = { seen: false, ...this.data?.lore };
                if (!this.behavior?.editable) {
                    this._menu.destroy();
                }
            });
        },
        update(this: PlayerInventoryItem & GameObj<SpriteComp | ContinuationTrapComp | NamedComp | ShaderComp | ControllableComp>) {
            if (this === player.holdingItem)
                this.flipX = player.flipX;
            this.controls[0]!.hint = K.sub(
                this.data?.hint ?? "&msg.ctlHint.continuation.default",
                {
                    which: "trap",
                    isDeferring: String(this.isDeferring),
                    willDefer: String(this.params.deferred),
                });
            this.controls[0]!.styles = [this.name.replace(/[^\w]/g, "")];
            this.controls[0]!.hidden = !this.enabled;

            this.zoop.outline.color = this.color;
            this.uniform!.u_targetcolor = this.color;

            if (!this.zoop.isZooping) {
                if (this.exists()
                    && this.enabled
                    && this.params.radius > 0
                    && player.manpage!.hidden
                    && player.inventory.includes(this)) {
                    this.zoop.hidden = false;
                    this.zoop.radius = zoopRadius(this.params.radius);
                }
                else this.zoop.hidden = true;
            }

            const targetAnim = this.isConnected ? "connected" : this.enabled ? (this.isDeferring ? "armed" : "ready") : "disabled";
            if (this.getCurAnim()?.name !== targetAnim) {
                if (this.hasAnim(targetAnim))
                    this.play(targetAnim);
                // if doesn't exist, must be checkpoint type
            }
        },
        menuUpdate(this: GameObj<ContinuationTrapComp | NamedComp>) {
            this._menu.term.data.name = this.name;
            for (var k of (Object.keys(this.params) as (keyof typeof this.params)[])) {
                const theOptIndex = switchesMenu.opts.findIndex(opt => opt.value === k);
                if (theOptIndex !== -1) {
                    (this.params[k] as boolean) = switchesMenu.selected.includes(theOptIndex);
                }
            }
            this.params.cName = cNameMenu.value;
            this.params.pName = pNameMenu.value;
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
            if (this.enabled && this.params.radius > 0 && (player.inventory.includes(this as any) || this.isDeferring)) {
                const willCapture = this.peekCapture();
                this.zoop.pos = willCapture.playerPos;
                for (var e of willCapture.objects) {
                    if ((e.obj as any) === this) continue;
                    if ((e.obj as any).has("invisible-trigger")) continue;
                    if (e.location.levelID !== WorldManager.activeLevel!.id) continue;
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
            const cont = K.add(continuation(this.name! as any, data, this)) as any as (PlayerInventoryItem & GameObj<ContinuationComp>);
            this.captured.push(cont);
            cont.onDestroy(() => this.captured.splice(this.captured.indexOf(cont), 1));
            player.playSound(soundOnCapture);
            splash(player.pos, this.color);
            this.zoop.radius = zoopRadius(this.params.radius);
            this.zoop.zoop().then(() => {
                player.addToInventory(cont);
                cont.activate();
                this.zoop.hidden = true;
            });
        },
        peekCapture(this: GameObj<ContinuationTrapComp | PosComp>): WorldSnapshot {
            return StateManager.capture(this.params, this.worldPos()!);
        },
        inspect() {
            return `enabled: ${this.enabled}, radius: ${this.params.radius}, preparing: ${this.isDeferring}`;
        },

        // editing stuff
        startEditing(this: GameObj<ContinuationTrapComp | PosComp>) {
            // copy the current state to the menu (probably unnecessary)
            switchesMenu.selected = switchesMenu.opts.flatMap((opt, i) => this.params[opt.value as any as keyof typeof this.params] ? [i] : []);
            pNameMenu.value = this.params.pName!;
            cNameMenu.value = this.params.cName!;
        },
    };
}
