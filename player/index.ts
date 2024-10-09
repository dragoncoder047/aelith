import { GameObj, PosComp, BodyComp, AreaComp, LayerComp, Comp, Tag, SpriteComp, KEventController, AudioPlayOpt, Vec2 } from "kaplay";
import { TILE_SIZE, JUMP_FORCE, TERMINAL_VELOCITY, FRICTION, RESTITUTION, ALPHA, BAP_OPTS, FOOTSTEP_INTERVAL } from "../constants";
import { K } from "../init";

import { MParser } from "../assets/mparser";
import { getMotionVector } from "./controls/impl";
import { thudder } from "../components/thudder";

export interface PlayerComp extends Comp {
    grabbing: GameObj<PosComp | BodyComp> | undefined
    intDist: number
    camFollower: KEventController | undefined
    footstepsCounter: number,
    canTouch(target: GameObj<PosComp>): boolean
    intersectingAny(type: Tag, where?: GameObj): boolean
    getTargeted(): GameObj<AreaComp | LayerComp> | undefined
    playSound(soundID: string, opt?: AudioPlayOpt | (() => AudioPlayOpt), pos?: Vec2, impactVel?: number): void
}

function playerComp(): PlayerComp {
    return {
        grabbing: undefined,
        camFollower: undefined,
        footstepsCounter: 0,
        add(this: GameObj) {
            // Keep player centered in window
            this.camFollower = this.onUpdate(() => {
                K.camPos(K.camPos().lerp(this.worldPos()!, ALPHA));
            });
        },
        update(this: GameObj<PlayerComp | PosComp | BodyComp>) {
            // move the grabbing to self
            if (this.grabbing !== undefined) {
                if (this.curPlatform() === this.grabbing) this.jump(1); // Reset curPlatform()
                this.grabbing.vel = K.vec2(0); // Reset velocity
                this.grabbing.moveTo(this.worldPos()!.sub(this.grabbing.parent!.worldPos()));
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
                    && object !== target
                    && object !== this.grabbing
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
                .filter(obj => (obj.is("box") || obj.is("lever")) && obj.isHovering() && this.canTouch(obj));
            candidates.unshift(...K.get<PosComp | AreaComp | LayerComp>("ui-button", { recursive: true })
                .filter(b => b.isHovering()));
            candidates.sort((a, b) => ((a?.layerIndex ?? 0) - (b?.layerIndex ?? 0)));
            return candidates[0];
        },
        draw(this: GameObj<PosComp | PlayerComp>) {
            const s = this.getTargeted() as GameObj<PosComp | SpriteComp | AreaComp> | undefined;
            if (s == undefined) {
                return;
            }
            // draw outline on object being hovered
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
        },
        /**
         * Play sound, but spatial relative to the player
         * @param opt Standard options
         * @param pos Position of the sound in world coordinates
         * @param impactVel Velocity of impact, if provided
         */
        playSound(this: GameObj<PosComp | PlayerComp>, soundID, opt = {}, pos = this.worldPos()!, impactVel = undefined) {
            if (typeof opt === "function") opt = opt();
            var v = opt.volume ?? 1;
            if (impactVel !== undefined) {
                v *= Math.min(1, 4 * impactVel / TERMINAL_VELOCITY);
            }
            const zz = K.play(soundID, opt);
            const func = () => {
                const dist = this.worldPos()!.dist(pos);
                const rv1 = Math.min(K.width(), K.height());
                const rv0 = Math.max(K.width(), K.height()) + rv1;
                zz.volume = v * K.mapc(dist, rv1, rv0, 1, 0);
                zz.pan = K.mapc(pos.x - this.pos.x, -this.intDist, this.intDist, -1, 1);
                // K.debug.log(soundID, "volume", zz.volume.toFixed(2), "pan", zz.pan.toFixed(2));
            };
            func();
            const u = this.onUpdate(func);
            zz.onEnd(u.cancel); // why does this never get called?
            K.wait(zz.duration(), u.cancel);
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
