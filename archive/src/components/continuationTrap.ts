import { AreaComp, Color, Comp, GameObj, NamedComp, PosComp, ShaderComp, SpriteComp } from "kaplay";
import trapTypes from "../assets/trapTypes.yaml";
import { SCALE, TILE_SIZE, WALK_SPEED } from "../constants";
import { K } from "../init";
import { WorldManager } from "../levels";
import { splash } from "../misc/particles";
import { drawZapLine, style } from "../misc/utils";
import { continuation } from "../object_factories/continuation";
import { promiseObj } from "../object_factories/promiseObj";
import { player } from "../player";
import { PlayerInventoryItem } from "../player/body";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";
import { PtyMenu } from "../plugins/kaplay-pty";
import { StateManager } from "../save_state";
import { StateComps, WorldSnapshot } from "../save_state/state";
import { MenuModal, modalmenu } from "../ui/menuFactory";
import { ContinuationComp } from "./continuationCore";
import { InteractableComp } from "./interactable";
import { LightHelperComp } from "./light_helpers";
import { PromiseComp } from "./promise";

export interface ContinuationTrapComp extends Comp {
    isDeferring: boolean
    isConnected: boolean
    captured: GameObj<ContinuationComp>[]
    readonly data: any | undefined
    readonly enabled: boolean
    readonly behavior: any | undefined
    params: any
    readonly color: Color
    _menu: MenuModal
    _manualObjects: Set<GameObj<StateComps>>;
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
    var prevObjs = new Set;
    var forcePlayerFlying = false;
    return {
        id: "continuation-trap",
        require: ["sprite", "pos", "named", "shader", "area", "interactable", "light"],
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
            return trapTypes[(this as any).name!];
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
        _menu: undefined as any,
        _manualObjects: new Set,
        add(this: GameObj<AreaComp | ContinuationTrapComp | NamedComp | SpriteComp | PosComp> & PlayerInventoryItem) {
            this.action1 = () => {
                if (!this.params.deferred || !this.isDeferring) {
                    this.prepare();
                    return true;
                }
                return false;
            };
            this.action2 = (targeted: any) => {
                if (this.behavior?.editable) {
                    if (this._manualObjects.has(targeted)) this._manualObjects.delete(targeted);
                    else this._manualObjects.add(targeted);
                    return true;
                }
                return false;
            };
            this.onCollide("machine", obj => {
                this.action2!(obj as any);
            });
            const dummy = { paused: false, forEventGroup() { return this }, cancel() { } } as KEventControllerPatch;
            this._menu = modalmenu(topMenu, ["menuActive", "contMenu"], "&editMenuCtlHint", dummy);
            this._menu.onStart(() => this.startEditing());
            this._menu.onUpdate(() => this.menuUpdate());
            this.action3 = () => {
                if (dummy.paused) return true;
                if (this.behavior?.editable) {
                    this._menu.open();
                    return true;
                }
                return false;
            };
            this.action4 = () => {
                if (this.data?.flyingEnabled) {
                    forcePlayerFlying = !forcePlayerFlying;
                    player.gravityScale = forcePlayerFlying ? -1 : 1;
                    return true;
                }
                return false;
            };
            this.motionHandler = () => {
                if (forcePlayerFlying) {
                    player.gravityScale = -1;
                    splash(player.pos.add(0, player.height / 2), this.color, 5, -10);
                    if (player.vel.slen() > WALK_SPEED * WALK_SPEED) {
                        player.vel = player.vel.unit().scale(WALK_SPEED);
                    }
                }
                return false;
            }
            this.on("thrown", () => {
                if (this.params.deferred && this.isDeferring) {
                    const newHoldingIndex = player.inventory.findLastIndex(i => (i as any).controlling === this);
                    player.scrollInventory(newHoldingIndex - player.holdingIndex);
                }
            });
            this.on("active", () => {
                if (forcePlayerFlying) player.gravityScale = -1;
            });
            this.on("inactive", () => {
                if (forcePlayerFlying) player.gravityScale = 1;
            });
            K.wait(0.1, () => {
                Object.assign(this.params, this.behavior);
                this.params.radius *= TILE_SIZE;
                this.manpage = { ...this.data?.lore, spriteSrc: this };
                if (!this.behavior?.editable) {
                    this._menu.destroy();
                }
            });
        },
        update(this: PlayerInventoryItem & GameObj<SpriteComp | ContinuationTrapComp | NamedComp | ShaderComp | LightHelperComp>) {
            if (this === player.holdingItem)
                this.flipX = player.flipX;

            if (this.enabled) {
                const styles = [this.name.replace(/[^\w]/g, "")];
                const data = {
                    isDeferring: String(this.isDeferring),
                    willDefer: String(this.params.deferred),
                    editable: String(this.behavior?.editable),
                    flyEnabled: String(this.data?.flyingEnabled),
                };
                const hintsObj = this.data?.hints.trap ?? {};
                this.action1Hint = hintsObj.action1 ? style(K.sub(hintsObj.action1, data), styles) : undefined;
                this.action2Hint = hintsObj.action2 ? style(K.sub(hintsObj.action2, data), styles) : undefined;
                this.action3Hint = hintsObj.action3 ? style(K.sub(hintsObj.action3, data), styles) : undefined;
                this.action4Hint = hintsObj.action4 ? style(K.sub(hintsObj.action4, data), styles) : undefined;
            } else {
                this.action1Hint = this.action2Hint = this.action3Hint = this.action4Hint = undefined;
            }

            this.uniform!.u_targetcolor = this.color;

            const targetAnim = this.isConnected ? "connected" : this.enabled ? (this.isDeferring ? "armed" : "ready") : "disabled";
            if (this.hasAnim(targetAnim)) {
                // if doesn't exist, must be checkpoint type
                this.play(targetAnim, { preventRestart: true });
            }
            if (this.frame === this.numFrames() - 1) {
                this.turnOff();
            } else {
                this.turnOn();
                this.light!.color = this.color;
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
        prepare(this: GameObj<ContinuationTrapComp> & PromiseComp["controlling"]) {
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
                const newObjs = new Set();
                for (var e of willCapture.objects) {
                    newObjs.add(e.obj);
                    if ((e.obj as any) === this) continue;
                    if ((e.obj as any).is("dont-highlight")) continue;
                    if (e.location.levelID !== WorldManager.activeLevel!.id) continue;
                    const bbox = e.obj.worldArea?.().bbox();
                    if (bbox) {
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
                        const origin = this.worldPos()!;
                        const center = e.obj.worldPos()!;
                        const direction = center.sub(origin);
                        const intersection = bbox.raycast(origin, direction);
                        drawZapLine(K.vec2(0), this.fromWorld(intersection?.point ?? center), { color: this.color, opacity: 0.7 }, e.obj.id, 1);
                    }
                }
                if (newObjs.difference(prevObjs).size > 0) {
                    player.playSound("worb", {}, this.worldPos()!);
                }
                prevObjs = newObjs;
            }
        },
        capture(this: GameObj<PosComp | ContinuationTrapComp | NamedComp | ShaderComp | InteractableComp>) {
            this.isDeferring = false;
            if (!this.enabled) return;
            const data = this.peekCapture();
            const cont = WorldManager.activeLevel!.levelObj.add(continuation(this.name! as any, data, this)) as any as (PlayerInventoryItem & GameObj<ContinuationComp>);
            player.addToInventory(cont);
            this.captured.push(cont);
            cont.onDestroy(() => this.captured.splice(this.captured.indexOf(cont), 1));
            player.playSound(soundOnCapture);
            splash(player.pos, this.color);
            splash(this.pos, this.color);
        },
        peekCapture(this: GameObj<ContinuationTrapComp | PosComp>): WorldSnapshot {
            return StateManager.capture(this.params, this.worldPos()!, this._manualObjects);
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
