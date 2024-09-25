import { GameObj, PosComp, BodyComp, AreaComp, LayerComp, Comp, Tag } from "kaplay";
import { infFriction } from "./components/infFriction";
import { TILE_SIZE, JUMP_FORCE, TERMINAL_VELOCITY } from "./constants";
import { K } from "./init";

import { MParser } from "./assets/mparser";

export interface PlayerComp extends Comp {
    grabbing: GameObj<PosComp | BodyComp> | undefined,
    intDist: number,
    canTouch(target: GameObj<PosComp>): boolean,
    intersectingAny(type: Tag, where?: GameObj): boolean,
    getTargeted(): GameObj<AreaComp | LayerComp> | undefined
}

function playerComp(): PlayerComp {
    return {
        grabbing: undefined,
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
                if (object.isObstacle && object !== target && object !== this.grabbing) {
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
            /**
             * @{import("kaplay").GameObj<import("kaplay").LayerComp>[]}
             */
            const candidates: GameObj<AreaComp | LayerComp>[] = [];
            for (var obj of MParser.world.get<AreaComp | LayerComp | PosComp>("hoverOutline")) {
                if (obj.isHovering() && this.canTouch(obj))
                    candidates.push(obj as GameObj<AreaComp | LayerComp>);
            }
            candidates.sort((a, b) => ((a?.layerIndex ?? 0) - (b?.layerIndex ?? 0)));
            return candidates[0];
        }
    };
}

export const player = K.add([
    K.sprite("player"),
    K.layer("player"),
    "player",
    K.pos(0, 0),
    K.area(/**/ {
        shape: new K.Polygon([
            K.vec2(0, -TILE_SIZE - 0.5),
            K.vec2(TILE_SIZE / 2, -TILE_SIZE / 2),
            K.vec2(TILE_SIZE / 2, TILE_SIZE / 2),
            K.vec2(-0.1, TILE_SIZE - 0.5),
            K.vec2(0.1, TILE_SIZE - 0.5),
            K.vec2(-TILE_SIZE / 2, TILE_SIZE / 2),
            K.vec2(-TILE_SIZE / 2, -TILE_SIZE / 2),
        ]),
    } /**/),
    K.body({ jumpForce: JUMP_FORCE, maxVelocity: TERMINAL_VELOCITY }),
    K.anchor("center"),
    K.state("normal"),
    infFriction(),
    playerComp(),
]);
