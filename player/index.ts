import { AnchorComp, AreaComp, AudioPlayOpt, BodyComp, Comp, GameObj, HealthComp, KEventController, NamedComp, OpacityComp, PlatformEffectorComp, PosComp, RaycastResult, SpriteComp, Tag, TimerComp, Vec2 } from "kaplay";
import { MParser } from "../assets/mparser";
import { STYLES } from "../assets/textStyles";
import { ContinuationTrapComp } from "../components/continuationTrap";
import { ControllableComp } from "../components/controllable";
import { HoldOffsetComp } from "../components/holdOffset";
import { LoreComp } from "../components/lore";
import { manpage, ManpageComp } from "../components/manpage";
import { thudder } from "../components/thudder";
import { ALPHA, FRICTION, INTERACT_DISTANCE, JUMP_FORCE, MARGIN, MAX_THROW_STRETCH, MAX_THROW_VEL, RESTITUTION, SCALE, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { DynamicTextComp } from "../plugins/kaplay-dynamic-text";
import { SpringComp } from "../plugins/kaplay-springs";
import { actuallyRaycast, ballistics } from "../utils";
import { ContinuationComp } from "../components/continuationCore";

export type PlayerInventoryItem = GameObj<PosComp | SpriteComp | BodyComp | NamedComp | AnchorComp | ReturnType<typeof K.platformEffector>>;

// MARK: PlayerComp
export interface PlayerComp extends Comp {
    sfxEnabled: boolean
    readonly holdingItem: PlayerInventoryItem | undefined
    readonly headPosWorld: Vec2
    _pull2Pos(other: PlayerInventoryItem): void
    camFollower: KEventController | undefined
    footstepsCounter: number,
    intersectingAny(type: Tag, where?: GameObj): boolean
    lookingAt: GameObj<AreaComp> | undefined
    lookingDirection: Vec2 | undefined
    playSound(soundID: string, opt?: AudioPlayOpt | (() => AudioPlayOpt), pos?: Vec2, impactVel?: number): { cancel(): void, onEnd(p: () => void): KEventController } | undefined;
    inventory: PlayerInventoryItem[]
    holdingIndex: number
    addToInventory(object: PlayerInventoryItem): void
    grab(object: PlayerInventoryItem): void
    removeFromInventory(item: PlayerInventoryItem): void
    drop(object: PlayerInventoryItem): void
    readonly throwImpulse: Vec2 | undefined
    throw(): void
    scrollInventory(dir: number): void
    canScrollInventory(dir: number): boolean
    lookAt(pos: Vec2 | undefined): void
    controlText: GameObj<DynamicTextComp>
    addControlText(text: string, styles?: string[]): void
    manpage: GameObj<ManpageComp> | undefined
    recalculateManpage(): void
}

function playerComp(): PlayerComp {
    return {
        sfxEnabled: true,
        get headPosWorld() {
            return (this as unknown as GameObj<PosComp>).worldPos()!.add(K.UP.scale(TILE_SIZE * 2 / 3));
        },
        get holdingItem() {
            return this.inventory[this.holdingIndex];
        },
        camFollower: undefined,
        footstepsCounter: 0,
        // MARK: add()
        add(this: GameObj<PlayerComp | PosComp | HealthComp | TimerComp | OpacityComp>) {
            // Keep player centered in window
            this.camFollower = this.onUpdate(() => {
                K.setCamPos(K.getCamPos().lerp(this.worldPos()!, ALPHA));
            });
            var loop: KEventController;
            var stopFlash: KEventController;
            this.onHurt(() => {
                if (loop) loop.cancel();
                if (stopFlash) stopFlash.cancel();
                loop = this.onUpdate(() => {
                    this.opacity = 1 - this.opacity;
                });
                stopFlash = this.wait(0.5, () => {
                    loop.cancel();
                    this.opacity = 1;
                });
            });
        },
        // MARK: _pull2Pos()
        _pull2Pos(this: GameObj<PlayerComp | SpriteComp | PosComp>, other) {
            if (!other) return;
            if (other.has("continuation-trap") && (other as unknown as GameObj<ContinuationTrapComp>).dontMoveToPlayer) return;
            other.vel = K.vec2(0);
            const offset = other.has("hold-offset") ? (other as GameObj<HoldOffsetComp> & PlayerInventoryItem).holdOffset : K.vec2(0);
            const fOffset = this.flipX ? offset.reflect(K.RIGHT) : offset;
            other.moveTo(this.worldPos()!.add((other as any).worldTransform.transformVector(K.vec2(0), K.vec2(0))).add(fOffset));
        },
        // MARK: update()
        update(this: GameObj<PlayerComp | PosComp | BodyComp | SpriteComp>) {
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
                            this.addControlText("&msg.ctlHint.switchItem    [special]&msg.ctlHint.viewInfo[/special]");
                    }
                    else
                        this.addControlText("&msg.ctlHint.switchItem");
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
                this.addControlText("&msg.ctlHint.manpage.exit");
                if (this.manpage!.needsToScroll)
                    this.addControlText("&msg.ctlHint.manpage.scroll");
            }
        },
        /**
         * True if overlapping any game object with the tag "type".
         */
        intersectingAny(this: GameObj<AreaComp>, type, where = MParser.world) {
            return !!where?.get<AreaComp>(type).some((obj: GameObj<AreaComp>) => this.isColliding(obj));
        },
        lookingAt: undefined,
        lookingDirection: K.LEFT,
        // MARK: draw()
        draw(this: GameObj<PosComp | PlayerComp>) {
            // find targeted object
            var rcr: RaycastResult = null;
            do {
                // nifty do-while-false loop to basically "goto end-of-this-block"

                this.lookingAt = undefined;
                if (!this.lookingDirection) break;

                const allObjects = K.get<AreaComp>("area", { recursive: true, only: "comps" })
                    .filter(x => !(this.inventory as any[]).includes(x)
                        && x.collisionIgnore.every(t => !this.is(t))
                        && !x.is("raycastIgnore")
                        && !x.paused);

                // First raycast only the objects we are interested in
                const interesting = allObjects.filter(x => x.is("interactable") || x.has("grabbable"));
                rcr = actuallyRaycast(
                    interesting,
                    this.headPosWorld,
                    this.lookingDirection,
                    INTERACT_DISTANCE);
                if (rcr === null || !rcr.object) break;

                // If we are in range of an interesting object, check to see
                // if it is obscured
                rcr = actuallyRaycast(
                    allObjects,
                    this.headPosWorld,
                    this.lookingDirection,
                    INTERACT_DISTANCE);
                if (rcr === null || !rcr.object) break;
                if (!(rcr.object.is("interactable") || rcr.object.has("grabbable"))) break;
                this.lookingAt = rcr.object as GameObj<AreaComp>;

            } while (false);

            if (this.lookingAt) {
                // draw outline on object being targeted
                const r = this.lookingAt.worldArea().bbox();
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
                    p1: this.fromWorld(this.headPosWorld),
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
        playSound(this: GameObj<PosComp | PlayerComp>, soundID, opt = {}, pos = this.worldPos()!, impactVel = undefined) {
            if (this.paused) return;
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
                zz.volume = v * K.mapc(dist, rv1, rv0, 1, 0);
                zz.pan = K.mapc(pos.x - this.pos.x, -INTERACT_DISTANCE, INTERACT_DISTANCE, -3 / 4, 3 / 4);
                // K.debug.log(soundID, "volume", zz.volume.toFixed(2), "pan", zz.pan.toFixed(2));
            };
            doWatch();
            const watchUpdate = this.onUpdate(doWatch);
            const done = () => {
                zz.stop();
                watchUpdate.cancel();
                waiting.cancel();
                onEndEvents.trigger();
            }
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
        addToInventory(this: GameObj<PlayerComp>, obj) {
            if (this.inventory.includes(obj)) return;
            // Put in inventory
            this.inventory.push(obj);
            this.scrollInventory(this.inventory.length);
            if (obj.has("platformEffector"))
                (obj as GameObj<PlatformEffectorComp>).platformIgnore.add(this);
        },
        grab(this: GameObj<PlayerComp>, obj) {
            // already have it. Problem.
            if (this.inventory.indexOf(obj) !== -1) {
                K.debug.log("BUG: tried to grab item that i already have");
                return;
            };
            this.addToInventory(obj);
            this.playSound("grab");
            this.trigger("grab", obj);
            obj.trigger("grabbed");
        },
        removeFromInventory(this: GameObj<PlayerComp | PosComp>, obj) {
            const i = this.inventory.indexOf(obj);
            if (i === -1) return;
            obj.paused = obj.hidden = false;
            if (obj.exists()) {
                obj.trigger("inactive");
                obj.moveTo(this.worldPos()!.sub(obj.parent?.worldPos?.()! ?? K.vec2(0)));
            }
            this.inventory.splice(i, 1);
            if (this.holdingIndex >= i)
                this.holdingIndex--;
            this.trigger("inventoryChange");
        },
        drop(this: GameObj<PlayerComp | PosComp>, obj) {
            if (!this.inventory.includes(obj)) {
                // already dropped it. Problem.
                K.debug.log("BUG: tried to drop item i don't have");
                return;
            };
            this.removeFromInventory(obj);
            if (obj.has("platformEffector"))
                [...this.inventory, this].forEach(item =>
                    (obj as unknown as GameObj<PlatformEffectorComp>).platformIgnore.add(item));
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
        throw(this: GameObj<PlayerComp>) {
            const thrown = this.holdingItem;
            if (!thrown || !this.throwImpulse || !thrown.is("throwable")) return;
            this.drop(thrown);
            thrown.trigger("thrown");
            thrown.applyImpulse(this.throwImpulse);
            this.playSound("throw");
            this.trigger("throw", thrown);
        },
        scrollInventory(this: GameObj<PlayerComp>, dir) {
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
            return (this.holdingIndex + dir) >= -1 && (this.holdingIndex + dir) < this.inventory.length;
        },
        lookAt(this: GameObj<PlayerComp | PosComp | SpriteComp>, pos) {
            if (!pos) {
                this.lookingDirection = undefined;
                return;
            }
            this.lookingDirection = pos.sub(this.headPosWorld);
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
            this.controlText.t = `\n${styles.map(t => `[${t}]`).join("")}${text}${styles.toReversed().map(t => `[/${t}]`).join("")}` + this.controlText.t;
        },

        // MARK: manpage
        manpage: undefined,
        recalculateManpage() {
            this.manpage!.sprite = (this.holdingItem?.has("continuation") ? (this.holdingItem as any as GameObj<ContinuationComp>).trappedBy : this.holdingItem) as any;
            this.manpage!.scrollPos = 0;
            if (this.holdingItem && this.holdingItem.has("lore")) {
                const oo = this.holdingItem as unknown as GameObj<LoreComp>;
                this.manpage!.section = `${oo.lore?.secName}(${oo.lore?.section})`;
                this.manpage!.body = String(oo.lore?.body!);
                this.manpage!.header = String(oo.lore?.header!);
                oo.lore.seen = true;
            }
        }
    };
}

export const player = K.add([
    playerComp(),
    K.sprite("player"),
    K.layer("player"),
    "player",
    K.pos(0, 0),
    K.health(16, 16),
    K.timer(),
    K.opacity(1),
    K.area({
        /**/
        shape: new K.Polygon([
            K.vec2(0, -TILE_SIZE - 0.5),
            K.vec2(TILE_SIZE / 2, -TILE_SIZE / 2),
            K.vec2(TILE_SIZE / 2, TILE_SIZE / 2),
            K.vec2(-0.1, TILE_SIZE - 0.5),
            K.vec2(0.1, TILE_SIZE - 0.5),
            K.vec2(-TILE_SIZE / 2, TILE_SIZE / 2),
            K.vec2(-TILE_SIZE / 2, -TILE_SIZE / 2),
        ]),
        /**/
        friction: FRICTION,
        restitution: RESTITUTION,
    }),
    K.body({ jumpForce: JUMP_FORCE, maxVelocity: TERMINAL_VELOCITY }),
    K.anchor("center"),
    K.state("normal"),
    {
        draw(this: GameObj<PosComp | PlayerComp>) {
            const h = this.holdingItem;
            if (h && (!h.has("continuation-trap") || !(h as unknown as GameObj<ContinuationTrapComp>).dontMoveToPlayer)) {
                // draw the item again on top
                K.pushTransform();
                K.pushMatrix((this as any).localTransform.inverse); // weird math
                K.pushTranslate(h.parent ? h.parent.worldTransform.transformVector(h.worldPos()!, K.vec2(0)) : K.vec2(0));
                K.pushTranslate(this.worldPos()!.sub(h.worldPos()!));
                h.draw();
                K.popTransform();
            }
        }
    },
    "raycastIgnore"
]);
// why is this necessary out here?
player.use(thudder(undefined, { detune: -500 }, (): boolean => !player.intersectingAny("button")));

// @ts-expect-error
window.player = player;

//------------------------------------------------------------

// add tail
var previous: GameObj = player;
var pos = K.vec2(0, TILE_SIZE / 2);
const numTailSegments = 8;
const maxTailSize = 4;
const tailColor = K.WHITE;
for (var i = 0; i < numTailSegments; i++) {
    const sz = K.lerp(1, maxTailSize, (1 - (i / numTailSegments)) ** 2);
    previous = K.add([
        K.circle(sz / 2),
        K.layer("playerTail"),
        K.opacity(0),
        K.pos(pos),
        K.anchor("center"),
        K.area({
            collisionIgnore: ["player", "tail", "noCollideWithTail"],
            friction: FRICTION / 10,
            restitution: 0
        }),
        K.body({
            mass: 0.1,
            damping: 0.1
        }),
        K.spring({
            other: previous as GameObj<BodyComp | PosComp>,
            springConstant: 100,
            springDamping: 50,
            dampingClamp: 100,
            length: sz / 2 + (previous?.radius ?? sz / 2),
            p2: K.vec2(0, previous === player ? 8 : 0),
            forceOther: previous !== player,
            drawOpts: {
                // @ts-expect-error
                width: sz,
                color: tailColor,
            },
        }),
        "tail",
        "raycastIgnore",
        {
            update(this: GameObj<OpacityComp | SpringComp>) {
                this.hidden = player.hidden || player.opacity === 0;
                this.drawOpts.opacity = player.opacity;
            }
        }
    ]);
    pos = pos.add(K.vec2(0, sz));
}
