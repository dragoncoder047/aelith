import { AnchorComp, AreaComp, AudioPlayOpt, BodyComp, Comp, GameObj, HealthComp, KEventController, NamedComp, OpacityComp, PlatformEffectorComp, PosComp, RaycastResult, SpriteComp, Tag, TimerComp, Vec2 } from "kaplay";
import { STYLES } from "../assets/textStyles";
import { ContinuationComp } from "../components/continuationCore";
import { ControllableComp } from "../components/controllable";
import { HoldOffsetComp } from "../components/holdOffset";
import { LoreComp } from "../components/lore";
import { ManpageComp } from "../components/manpage";
import { ALPHA, INTERACT_DISTANCE, MARGIN, MAX_THROW_STRETCH, MAX_THROW_VEL, SCALE, TERMINAL_VELOCITY } from "../constants";
import { K } from "../init";
import { WorldManager } from "../levels";
import { actuallyRaycast, ballistics } from "../misc/utils";
import { PAreaComp } from "../plugins/kaplay-aabb";
import { DynamicTextComp } from "../plugins/kaplay-dynamic-text";
import { PlayerHeadComp } from "./head";
import { TailComp } from "./tail";


export type PlayerInventoryItem = GameObj<PosComp | SpriteComp | BodyComp | NamedComp | AnchorComp | PlatformEffectorComp>;
// MARK: PlayerComp

export interface PlayerBodyComp extends Comp {
    sfxEnabled: boolean;
    readonly holdingItem: PlayerInventoryItem | undefined;
    head: GameObj<PosComp | PlayerHeadComp> | undefined
    flash(duration?: number): void
    _pull2Pos(other: PlayerInventoryItem): void;
    camFollower: KEventController | undefined;
    footstepsCounter: number;
    intersectingAny(type: Tag, where?: GameObj): boolean;
    lookingAt: GameObj<PAreaComp> | undefined;
    lookingDirection: Vec2 | undefined;
    playSound(soundID: string, opt?: AudioPlayOpt | (() => AudioPlayOpt), pos?: Vec2, impactVel?: number, object?: GameObj): { cancel(): void; onEnd(p: () => void): KEventController; } | undefined;
    inventory: PlayerInventoryItem[];
    holdingIndex: number;
    addToInventory(object: PlayerInventoryItem): void;
    grab(object: PlayerInventoryItem): void;
    removeFromInventory(item: PlayerInventoryItem): void;
    drop(object: PlayerInventoryItem): void;
    readonly throwImpulse: Vec2 | undefined;
    throw(): void;
    scrollInventory(dir: number): void;
    canScrollInventory(dir: number): boolean;
    lookAt(pos: Vec2 | undefined): void;
    controlText: GameObj<DynamicTextComp>;
    addControlText(text: string, styles?: string[]): void;
    manpage: GameObj<ManpageComp> | undefined;
    recalculateManpage(): void;
    tpTo(pos: Vec2): void;
    freeze(paused: boolean): void;
}
export function playerBody(): PlayerBodyComp {
    var flashLoop: KEventController;
    var stopFlashWaiter: KEventController;
    return {
        id: "player-body",
        sfxEnabled: true,
        head: undefined,
        get holdingItem() {
            return this.inventory[this.holdingIndex];
        },
        camFollower: undefined,
        footstepsCounter: 0,
        tpTo(this: GameObj<PosComp | BodyComp>, pos) {
            const delta = pos.sub(this.pos);
            this.moveBy(delta);
            this.vel = K.vec2(0);
            K.get<PosComp>("head").forEach(t => t.moveBy(delta));
            K.get<TailComp>("tail").forEach(t => t.restore2Pos());
            K.setCamPos(this.worldPos()!);
        },
        freeze(this: GameObj, paused) {
            this.paused = paused;
            K.get<PosComp>("head").forEach(t => t.paused = paused);
            K.get<TailComp>("tail").forEach(t => t.paused = paused);
        },
        // MARK: add()
        add(this: GameObj<PlayerBodyComp | PosComp | HealthComp | TimerComp | OpacityComp>) {
            // Keep player centered in window
            this.camFollower = this.on("fixedUpdate", () => {
                K.setCamPos(K.getCamPos().lerp(this.worldPos()!, ALPHA));
            });
        },
        flash(this: GameObj<OpacityComp | TimerComp>, duration = 0.5) {
            if (flashLoop) flashLoop.cancel();
            if (stopFlashWaiter) stopFlashWaiter.cancel();
            flashLoop = this.loop(0.05, () => {
                this.opacity = 1 - this.opacity;
            });
            stopFlashWaiter = this.wait(duration, () => {
                flashLoop.cancel();
                this.opacity = 1;
            });
        },
        // MARK: _pull2Pos()
        _pull2Pos(this: GameObj<PlayerBodyComp | SpriteComp | PosComp>, other) {
            if (!other) return;
            other.vel = K.vec2(0);
            const offset = other.has("hold-offset") ? (other as GameObj<HoldOffsetComp> & PlayerInventoryItem).holdOffset : K.vec2(0);
            const fOffset = this.flipX ? offset.reflect(K.RIGHT) : offset;
            other.pos = fOffset;
        },
        // MARK: update()
        update(this: GameObj<PlayerBodyComp | BodyComp>) {
            // hide all inventory items
            this.inventory.forEach(item => item.paused = item.hidden = true);
            // move the grabbing to self
            const h = this.holdingItem;
            if (h !== undefined) {
                // Clear curPlatform() if I'm standing on it
                if (this.curPlatform() === h) this.jump(1);
                h.paused = h.hidden = false;
                this._pull2Pos(h);
            }
            // update control text
            this.controlText.t = "";
            if (this.manpage!.hidden) {
                this.addControlText("&msg.ctlHint.sprint    &msg.ctlHint.pause.open");
                this.addControlText("&msg.ctlHint.move    &msg.ctlHint.jump");
                if (this.inventory.length > 0) {
                    if (this.holdingItem?.has("lore")) {
                        if ((this.holdingItem! as unknown as GameObj<LoreComp>).lore.seen)
                            this.addControlText("&msg.ctlHint.switchItem    &msg.ctlHint.viewInfo");
                        else
                            this.addControlText("&msg.ctlHint.switchItem    [rainbow]&msg.ctlHint.viewInfo[/rainbow]");
                    }
                }
                if (this.lookingAt?.has("grabbable"))
                    this.addControlText("&msg.ctlHint.look    &msg.ctlHint.grab");
                else if (this.holdingItem?.is("throwable"))
                    this.addControlText("&msg.ctlHint.aim    &msg.ctlHint.throw");
                else this.addControlText("&msg.ctlHint.look");
                if (this.lookingAt?.is("interactable"))
                    this.addControlText("&msg.ctlHint.interact");
                if (this.holdingItem?.has("controllable")) {
                    for (var c of (this.holdingItem as unknown as GameObj<ControllableComp>).controls) {
                        if (!c.hidden) this.addControlText(c.hint, c.styles);
                    }
                }
            } else {
                if (this.manpage!.data.requiresKeyboard === "true") {
                    this.addControlText("&msg.ctlHint.dialog.msg.exit");
                } else {
                    this.addControlText("&msg.ctlHint.dialog.exit");
                    if (this.manpage!.needsToScroll)
                        this.addControlText("&msg.ctlHint.dialog.scroll");
                }
            }
        },
        /**
         * True if overlapping any game object with the tag "type".
         */
        intersectingAny(this: GameObj<AreaComp>, type, where = WorldManager.activeLevel?.levelObj) {
            return !!where?.get<AreaComp>(type).some((obj: GameObj<AreaComp>) => obj.worldArea().collides(this.worldArea()));
        },
        lookingAt: undefined,
        lookingDirection: K.LEFT,
        // MARK: draw()
        draw(this: GameObj<PosComp | PlayerBodyComp>) {
            // find targeted object
            var rcr: RaycastResult = null;
            do {
                // nifty do-while-false loop to basically "goto end-of-this-block"
                this.lookingAt = undefined;
                if (!this.lookingDirection) break;

                const allObjects = WorldManager.activeLevel!.levelObj.get<PAreaComp>("area")
                    .filter(x => !(this.inventory as any[]).includes(x)
                        && x.collisionIgnore.every(xx => !this.tags.includes(xx))
                        && !x.is("raycastIgnore")
                        && !x.paused);

                // First raycast only the objects we are interested in
                const interesting = allObjects.filter(x => x.is("interactable") || x.has("grabbable"));
                rcr = actuallyRaycast(
                    interesting,
                    this.head!.worldPos()!,
                    this.lookingDirection,
                    INTERACT_DISTANCE);
                if (rcr === null || !rcr.object) break;

                // If we are in range of an interesting object, check to see
                // if it is obscured
                rcr = actuallyRaycast(
                    allObjects,
                    this.head!.worldPos()!,
                    this.lookingDirection,
                    INTERACT_DISTANCE);
                if (rcr === null || !rcr.object) break;
                if (!(rcr.object.is("interactable") || rcr.object.has("grabbable"))) break;
                this.lookingAt = rcr.object as GameObj<PAreaComp>;

            } while (false);

            if (this.lookingAt) {
                // draw outline on object being targeted
                const r = this.lookingAt.aabb();
                K.drawRect({
                    fill: false,
                    width: r.width,
                    height: r.height,
                    pos: this.fromWorld(r.pos),
                    outline: {
                        width: 2 / SCALE,
                        color: K.WHITE,
                        opacity: K.wave(0, 1, K.time() * Math.PI * 2),
                        join: "miter",
                    }
                });
            }
            if (rcr && this.lookingAt) {
                // draw line to object being hovered
                K.drawLine({
                    p1: this.fromWorld(this.head!.worldPos()!),
                    p2: this.fromWorld(rcr.point),
                    width: 2 / SCALE,
                    color: K.WHITE.darken(200)
                });
            } else if (this.holdingItem?.is("throwable") && this.throwImpulse) {
                // draw throwing line to show trajectory of
                // item being held when it is thrown
                K.drawCurve(t => ballistics(K.vec2(0), this.throwImpulse!, t), {
                    width: 2 / SCALE,
                    color: K.BLUE.darken(127),
                });
            }
        },
        // MARK: playSound()
        /**
         * Play sound, but spatial relative to the player
         * @param opt Standard options
         * @param pos Position of the sound in world coordinates
         * @param impactVel Velocity of impact, if provided
         */
        playSound(this: GameObj<PosComp | PlayerBodyComp>, soundID, opt = {}, pos = this.worldPos()!, impactVel, object) {
            if (!this.sfxEnabled) return;
            if (typeof opt === "function") opt = opt();
            const onEndEvents = new K.KEvent<[]>();
            var v = opt.volume ?? 1;
            if (impactVel !== undefined) {
                v *= Math.min(1, 4 * impactVel / TERMINAL_VELOCITY);
            }
            const zz = K.play(soundID, opt);
            const doWatch = () => {
                const dist = this.worldPos()!.dist(pos);
                const rv1 = Math.min(K.width(), K.height()) * 2 / 3;
                const rv0 = rv1 * 2;
                const oExists = !object || !object.hidden || WorldManager.getLevelOf(object) === WorldManager.activeLevel?.levelObj;
                zz.volume = oExists ? v * K.mapc(dist, rv1, rv0, 1, 0) : 0;
                zz.pan = K.mapc(pos.x - this.pos.x, -INTERACT_DISTANCE, INTERACT_DISTANCE, -3 / 4, 3 / 4);
            };
            doWatch();
            const watchUpdate = this.onUpdate(doWatch);
            const done = () => {
                zz.stop();
                watchUpdate.cancel();
                waiting.cancel();
                onEndEvents.trigger();
            };
            const waiting = K.wait(Math.max(zz.duration(), 0.5), done);
            zz.onEnd(done); // why does this never get called?
            return {
                cancel: () => {
                    onEndEvents.clear();
                    done();
                },
                onEnd(p) {
                    return onEndEvents.add(p);
                },
            };
        },
        // MARK: inventory
        inventory: [],
        holdingIndex: -1,
        addToInventory(this: GameObj<PlayerBodyComp>, obj) {
            if (this.inventory.includes(obj)) return;
            // find anything that has curPlatform being this
            // object and make it jump slightly to prevent kaplayjs/kaplay#628
            K.get<BodyComp>("*", { recursive: true }).forEach(b => {
                if (b.has("body") && b.stickToPlatform !== false && b.curPlatform() !== null) {
                    b.jump(10);
                }
            });
            obj.setParent(this, { keep: K.KeepFlags.Pos });
            // Put in inventory
            this.inventory.push(obj);
            this.scrollInventory(this.inventory.length);
            if (obj.has("platformEffector"))
                (obj as any as GameObj<PlatformEffectorComp>).platformIgnore.add(this);
        },
        grab(this: GameObj<PlayerBodyComp>, obj) {
            // already have it. Problem.
            if (this.inventory.includes(obj)) {
                K.debug.log("BUG: tried to grab item that i already have");
                return;
            };
            this.addToInventory(obj);
            this.playSound("grab");
            this.trigger("grab", obj);
            obj.trigger("grabbed");
        },
        removeFromInventory(this: GameObj<PlayerBodyComp | PosComp>, obj) {
            const i = this.inventory.indexOf(obj);
            if (i === -1) return;
            obj.paused = obj.hidden = false;
            if (obj.exists()) {
                obj.setParent(WorldManager.activeLevel!.levelObj, { keep: K.KeepFlags.Pos });
                obj.vel = K.vec2(0);
                obj.trigger("inactive");
            }
            this.inventory.splice(i, 1);
            if (this.holdingIndex > i || this.holdingIndex === this.inventory.length)
                this.holdingIndex--;
            this.trigger("inventoryChange");
        },
        drop(this: GameObj<PlayerBodyComp | PosComp>, obj) {
            if (!this.inventory.includes(obj)) {
                // already dropped it. Problem.
                K.debug.log("BUG: tried to drop item i don't have");
                return;
            };
            this.removeFromInventory(obj);
            if (obj.has("platformEffector"))
                [...this.inventory, this].forEach(item => (obj as unknown as GameObj<PlatformEffectorComp>).platformIgnore.add(item));
            this.trigger("drop", obj);
            obj.trigger("dropped");
        },
        get throwImpulse() {
            if (!this.lookingDirection || this.lookingDirection.slen() < 0.01) return undefined;
            var direction = this.lookingDirection.scale(SCALE * MAX_THROW_VEL / MAX_THROW_STRETCH);
            const len = direction.len();
            if (len > MAX_THROW_VEL) direction = direction.scale(MAX_THROW_VEL / len);
            return direction;
        },
        throw(this: GameObj<PlayerBodyComp>) {
            const thrown = this.holdingItem;
            if (!thrown || !this.throwImpulse || !thrown.is("throwable")) {
                this.trigger("whiff");
                return;
            }
            this.drop(thrown);
            thrown.trigger("thrown");
            thrown.applyImpulse(this.throwImpulse);
            this.playSound("throw");
            this.trigger("throw", thrown);
        },
        scrollInventory(this: GameObj<PlayerBodyComp>, dir) {
            const oldIndex = this.holdingIndex;
            const wasHolding = this.holdingItem;
            this.holdingIndex = K.clamp(this.holdingIndex + dir, -1, this.inventory.length - 1);
            if (oldIndex === this.holdingIndex) return;
            const nowHolding = this.holdingItem;
            if (wasHolding) {
                wasHolding.trigger("inactive");
                wasHolding.paused = wasHolding.hidden = true;
            }
            if (nowHolding) {
                nowHolding.trigger("active");
                nowHolding.paused = nowHolding.hidden = false;
            }
            this.trigger("inventoryChange");
        },
        canScrollInventory(dir) {
            return (this.holdingIndex + dir) >= -1 && (this.holdingIndex + dir) < this.inventory.length && this.inventory.length > 0;
        },
        lookAt(this: GameObj<PlayerBodyComp | PosComp | SpriteComp>, pos) {
            if (!pos) {
                this.lookingDirection = undefined;
                return;
            }
            this.lookingDirection = pos.sub(this.head!.worldPos()!);
            if (this.lookingDirection.x < 0) this.flipX = false;
            else if (this.lookingDirection.x > 0) this.flipX = true;
        },
        // MARK: note object
        controlText: K.add([
            K.dynamicText(""),
            K.text("", {
                size: 12 / SCALE,
                align: "center",
                styles: STYLES,
                lineSpacing: 1.15,
            }),
            K.fixed(),
            K.anchor("bot"),
            K.pos(),
            K.layer("ui"),
            {
                add(this: GameObj<PosComp>) {
                    const func = () => {
                        this.pos = K.vec2(K.center().x, K.height() - MARGIN);
                    };
                    K.onResize(func);
                    func();
                }
            }
        ]),
        addControlText(text, styles = []) {
            this.controlText.t = `\n${styles.map(t => `[${t}]`).join("")}${text}${styles.toReversed().map(t => `[/${t}]`).join("")}${this.controlText.t}`;
        },

        // MARK: manpage
        manpage: undefined,
        recalculateManpage() {
            this.manpage!.sprite = (this.holdingItem?.has("continuation") ? (this.holdingItem as any as GameObj<ContinuationComp>).trappedBy : this.holdingItem?.has("promise") ? (this.holdingItem as any).controlling : this.holdingItem) as any;
            this.manpage!.scrollPos = 0;
            if (this.holdingItem && this.holdingItem.has("lore")) {
                const oo = this.holdingItem as unknown as GameObj<LoreComp>;
                this.manpage!.section = `${oo.lore?.secName}(${oo.lore?.section})`;
                this.manpage!.body = String((oo.lore?.body)!);
                this.manpage!.header = String((oo.lore?.header)!);
                oo.lore.seen = true;
            }
        }
    };
}
