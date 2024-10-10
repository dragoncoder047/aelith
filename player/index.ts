import { AnchorComp, AreaComp, AudioPlayOpt, BodyComp, Comp, GameObj, KEventController, LayerComp, NamedComp, PlatformEffectorComp, PosComp, SpriteComp, Tag, Vec2 } from "kaplay";
import { MParser } from "../assets/mparser";
import { thudder } from "../components/thudder";
import { ALPHA, FRICTION, JUMP_FORCE, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";

export type PlayerInventoryItem = GameObj<PosComp | SpriteComp | BodyComp | NamedComp | AnchorComp>;

export interface PlayerComp extends Comp {
    readonly holdingItem: PlayerInventoryItem | undefined
    intDist: number
    camFollower: KEventController | undefined
    footstepsCounter: number,
    canTouch(target: GameObj<PosComp>): boolean
    intersectingAny(type: Tag, where?: GameObj): boolean
    getTargeted(): GameObj<AreaComp | LayerComp> | undefined
    playSound(soundID: string, opt?: AudioPlayOpt | (() => AudioPlayOpt), pos?: Vec2, impactVel?: number): { cancel(): void, onEnd(p: () => void): KEventController }
    inventory: PlayerInventoryItem[]
    holdingIndex: number
    grab(object: PlayerInventoryItem): void
    drop(object: PlayerInventoryItem): void
}

function playerComp(): PlayerComp {
    return {
        get holdingItem() {
            return this.inventory[this.holdingIndex];
        },
        camFollower: undefined,
        footstepsCounter: 0,
        add(this: GameObj) {
            // Keep player centered in window
            this.camFollower = this.onUpdate(() => {
                K.camPos(K.camPos().lerp(this.worldPos()!, ALPHA));
            });
        },
        update(this: GameObj<PlayerComp | PosComp | BodyComp>) {
            // hide all inventory items
            this.inventory.forEach(item => {
                item.paused = true;
                item.hidden = true;
            });
            // move the grabbing to self
            if (this.holdingItem !== undefined) {
                if (this.curPlatform() === this.holdingItem) this.jump(1); // Reset curPlatform()
                this.holdingItem.vel = K.vec2(0); // Reset velocity
                this.holdingItem.moveTo(this.worldPos()!.sub(this.holdingItem.parent!.worldPos()!));
                this.holdingItem.paused = false;
                this.holdingItem.hidden = false;
            }
        },
        /**
         * Interaction distance
         */
        intDist: TILE_SIZE * 4,
        canTouch(this: GameObj<PlayerComp | PosComp>, target) {
            // is a UI button?
            if (target.is("ui-button"))
                return true;
            // always gonna be too far?
            const diff = target.worldPos()!.sub(this.worldPos()!);
            if (diff.len() > this.intDist)
                return false;
            if (!MParser.world)
                return true; // bail if world isn't initialized yet
            const line = new K.Line(this.worldPos()!, target.worldPos()!);
            for (var object of MParser.world.get(["area", "tile"])) {
                if (object.isObstacle
                    && !object.paused
                    && object !== target
                    && object !== this.holdingItem
                    && object.collisionIgnore.every((t: string) => !this.is(t))) {
                    const boundingbox = object.worldArea();
                    if (boundingbox.collides(line)) {
                        return false;
                    }
                }
            }
            return true;
        },
        /**
         * True if overlapping any game object with the tag "type".
         */
        intersectingAny(this: GameObj<AreaComp>, type, where = MParser.world) {
            return !!where?.get<AreaComp>(type).some((obj: GameObj<AreaComp>) => this.isColliding(obj));
        },
        /**
         * Get the currently hovering object, or undefined.
         */
        getTargeted() {
            if (!MParser.world)
                return;
            const candidates = MParser.world.get<AreaComp | LayerComp | PosComp>("area")
                .filter(obj => (obj.is("box") || obj.is("lever")) && !obj.paused && obj.isHovering() && this.canTouch(obj));
            candidates.unshift(...K.get<PosComp | AreaComp | LayerComp>("ui-button", { recursive: true })
                .filter(b => b.isHovering()));
            candidates.sort((a, b) => ((a?.layerIndex ?? 0) - (b?.layerIndex ?? 0)));
            return candidates[0];
        },
        draw(this: GameObj<PosComp | PlayerComp>) {
            // draw outline on object being hovered
            const s = this.getTargeted() as GameObj<PosComp | SpriteComp | AreaComp> | undefined;
            if (s !== undefined && !s.is("ui-button")) {
                const r = s.worldArea().bbox();
                K.drawRect({
                    fill: false,
                    width: r.width,
                    height: r.height,
                    pos: this.fromWorld(r.pos),
                    outline: {
                        width: 2,
                        color: K.WHITE,
                        opacity: K.wave(0, 1, K.time() * Math.PI * 2),
                        join: "miter",
                    }
                });
            }
            // // draw holding object on top of self
            // const h = this.holdingItem;
            // if (h !== undefined) {
            //     K.drawSprite({
            //         sprite: h.sprite,
            //         pos: K.vec2(0),
            //         frame: h.frame,
            //     });
            // }
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
                zz.pan = K.mapc(pos.x - this.pos.x, -this.intDist, this.intDist, -1, 1);
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
            const waiting = K.wait(zz.duration(), done);
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
        holdingIndex: 0,
        grab(this: GameObj<PlayerComp>, obj) {
            // already have it. Problem.
            if (this.inventory.indexOf(obj) !== -1) {
                K.debug.log("BUG: tried to grab item that i already have");
                return;
            };
            // Put in inventory
            this.holdingIndex = this.inventory.length;
            this.inventory.push(obj);
            obj.paused = true;
            obj.hidden = true;
            this.playSound("grab");
            this.trigger("inventoryChange");
        },
        drop(this: GameObj<PlayerComp | PosComp>, obj) {
            const i = this.inventory.indexOf(obj);
            // already dropped it. Problem.
            if (i === -1) {
                K.debug.log("BUG: tried to drop item i don't have");
                return;
            };
            obj.paused = false;
            obj.hidden = false;
            obj.moveTo(this.worldPos()!.sub(obj.parent!.worldPos()!));
            this.inventory.splice(i, 1);
            if (this.holdingIndex >= this.inventory.length) {
                this.holdingIndex = this.inventory.length - 1;
            }
            if (obj.is("platformEffector")) {
                (obj as unknown as GameObj<PlatformEffectorComp>).platformIgnore.add(this);
            }
            this.trigger("inventoryChange");
        }
    };
}

export const player = K.add([
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
    playerComp(),
]);
// why is this necessary out here?
player.use(thudder(undefined, { detune: -500 }, (): boolean => !player.intersectingAny("button")));

// @ts-expect-error
window.player = player;
