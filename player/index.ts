import { AnchorComp, AreaComp, AudioPlayOpt, BodyComp, CircleComp, Comp, GameObj, KEventController, NamedComp, PlatformEffectorComp, PosComp, RaycastResult, SpriteComp, Tag, Vec2 } from "kaplay";
import { MParser } from "../assets/mparser";
import { thudder } from "../components/thudder";
import { ALPHA, FRICTION, INTERACT_DISTANCE, JUMP_FORCE, MAX_THROW_STRETCH, MAX_THROW_VEL, RESTITUTION, SCALE, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";

export type PlayerInventoryItem = GameObj<PosComp | SpriteComp | BodyComp | NamedComp | AnchorComp | ReturnType<typeof K.platformEffector>>;

export interface PlayerComp extends Comp {
    readonly holdingItem: PlayerInventoryItem | undefined
    readonly headPosWorld: Vec2
    camFollower: KEventController | undefined
    footstepsCounter: number,
    intersectingAny(type: Tag, where?: GameObj): boolean
    lookingAt: GameObj<AreaComp> | undefined
    lookingDirection: Vec2 | undefined
    playSound(soundID: string, opt?: AudioPlayOpt | (() => AudioPlayOpt), pos?: Vec2, impactVel?: number): { cancel(): void, onEnd(p: () => void): KEventController }
    inventory: PlayerInventoryItem[]
    holdingIndex: number
    addToInventory(object: PlayerInventoryItem): void
    grab(object: PlayerInventoryItem): void
    removeFromInventory(item: PlayerInventoryItem): void
    drop(object: PlayerInventoryItem): void
    readonly throwImpulse: Vec2 | undefined
    throw(): void
    scrollInventory(dir: 1 | -1): void
    canScrollInventory(dir: 1 | -1): boolean
    lookAt(pos: Vec2 | undefined): void
}

function playerComp(): PlayerComp {
    return {
        get headPosWorld() {
            return (this as unknown as GameObj<PosComp>).worldPos()!.add(K.UP.scale(TILE_SIZE * 2 / 3));
        },
        get holdingItem() {
            return this.inventory[this.holdingIndex];
        },
        camFollower: undefined,
        footstepsCounter: 0,
        add(this: GameObj<PlayerComp | PosComp>) {
            // Keep player centered in window
            this.camFollower = this.onUpdate(() => {
                K.camPos(K.camPos().lerp(this.worldPos()!, ALPHA));
            });
        },
        update(this: GameObj<PlayerComp | PosComp | BodyComp>) {
            // hide all inventory items
            this.inventory.forEach(item => item.paused = item.hidden = true);
            // move the grabbing to self
            const h = this.holdingItem;
            if (h !== undefined) {
                // Clear curPlatform() if I'm standing on it
                if (this.curPlatform() === h) this.jump(1);
                h.vel = K.vec2(0); // Reset velocity
                h.moveTo(this.worldPos()!.add(h.transform.transformVector(K.vec2(0), K.vec2(0))));
                h.paused = h.hidden = false;
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
        draw(this: GameObj<PosComp | PlayerComp>) {
            // find targeted object
            var rcr: RaycastResult = null;
            do { // nifty do-while-false loop to basically "goto end-of-this-block"
                this.lookingAt = undefined;
                if (!MParser.world || !this.lookingDirection) break;
                rcr = actuallyRaycast(
                    MParser.world.get<AreaComp>("area")
                        .filter(x => (this.inventory as any[]).indexOf(x) === -1
                            && x.collisionIgnore.every(t => !this.is(t))
                            && !x.paused
                            && !x.is("tail")),
                    this.headPosWorld,
                    this.lookingDirection,
                    INTERACT_DISTANCE);
                if (rcr === null) break;
                const obj = rcr.object as GameObj<AreaComp>;

                if (!obj || (!obj.is("interactable") && !obj.is("grabbable")))
                    break;

                this.lookingAt = obj;
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
                    width: 1 / SCALE,
                    color: K.WHITE.darken(200)
                });
            } else if (this.holdingItem?.is("throwable") && this.throwImpulse) {
                // draw throwing line to show trajectory of
                // item being held when it is thrown
                K.drawCurve(t => ballistics(K.vec2(0), this.throwImpulse!, t), {
                    width: 1 / SCALE,
                    color: K.BLUE.darken(127),
                });
            }
        },
        /**
         * Play sound, but spatial relative to the player
         * @param opt Standard options
         * @param pos Position of the sound in world coordinates
         * @param impactVel Velocity of impact, if provided
         */
        playSound(this: GameObj<PosComp | PlayerComp>, soundID, opt = {}, pos = this.worldPos()!, impactVel = undefined) {
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
        inventory: [],
        holdingIndex: -1,
        addToInventory(this: GameObj<PlayerComp>, obj) {
            // Put in inventory
            this.holdingIndex = this.inventory.length;
            this.inventory.push(obj);
            obj.paused = true;
            obj.hidden = true;
            this.trigger("inventoryChange");
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
        },
        removeFromInventory(this: GameObj<PlayerComp | PosComp>, obj) {
            const i = this.inventory.indexOf(obj);
            if (i === -1) return;
            obj.paused = obj.hidden = false;
            obj.moveTo(this.worldPos()!.sub(obj.parent!.worldPos()!));
            this.inventory.splice(i, 1);
            if (this.holdingIndex >= this.inventory.length)
                this.holdingIndex = this.inventory.length - 1;
            this.trigger("inventoryChange");
        },
        drop(this: GameObj<PlayerComp | PosComp>, obj) {
            const i = this.inventory.indexOf(obj);
            // already dropped it. Problem.
            if (i === -1) {
                K.debug.log("BUG: tried to drop item i don't have");
                return;
            };
            if (obj.is("platformEffector"))
                (obj as unknown as GameObj<PlatformEffectorComp>).platformIgnore.add(this);
            this.removeFromInventory(obj);
            this.trigger("drop", obj);
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
            thrown.applyImpulse(this.throwImpulse);
            this.playSound("throw");
            this.trigger("throw", thrown);
        },
        scrollInventory(this: GameObj<PlayerComp>, dir) {
            this.holdingIndex += dir;
            if (this.holdingIndex < -1) this.holdingIndex = -1;
            if (this.holdingIndex >= this.inventory.length) this.holdingIndex = this.inventory.length - 1;
            this.trigger("inventoryChange");
        },
        canScrollInventory(dir) {
            if (dir === 1) {
                return this.holdingIndex < this.inventory.length - 1;
            }
            if (dir === -1) {
                return this.holdingIndex > -1;
            }
            return false;
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
    };
}

export const player = K.add([
    playerComp(),
    K.sprite("player"),
    K.layer("player"),
    "player",
    K.pos(0, 0),
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
            if (this.holdingItem) {
                // draw the item again on top
                K.pushTransform();
                K.pushMatrix(this.transform.inverse); // weird math
                K.pushTranslate(this.holdingItem.parent ? this.holdingItem.parent.transform.transformVector(this.holdingItem.worldPos()!, K.vec2(0)) : K.vec2(0));
                this.holdingItem.draw();
                K.popTransform();
            }
        }
    }
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
    ]);
    pos = pos.add(K.vec2(0, sz));
}


//------------------------------------------------------------

function actuallyRaycast(objects: GameObj<AreaComp>[], origin: Vec2, direction: Vec2, distance: number) {
    direction = direction.unit().scale(distance);
    var result: RaycastResult = null;
    for (var obj of objects) {
        const wa = obj.worldArea();
        const thisResult = wa.raycast(origin, direction);
        if (thisResult === null) continue;
        if (result === null || thisResult.fraction < result.fraction) {
            result = thisResult;
            result.object = obj;
        }
    }
    return result;
}

function ballistics(pos: Vec2, vel: Vec2, t: number) {
    return pos.add(vel.scale(t)).add(K.getGravityDirection().scale(K.getGravity() * t * t / 2));
}
