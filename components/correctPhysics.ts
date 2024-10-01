import { BodyComp, Comp, GameObj, Tag } from "kaplay";
import { K } from "../init";

export interface CorrectPhysicsComp extends Comp {
    require: string[] // why is this necessary?
}

/**
 * A fix for kaplayjs/kaplay#420
 */
export function correctPhysics(): CorrectPhysicsComp {
    return {
        require: ["body"],
        add(this: GameObj<BodyComp>) {
            this.onPhysicsResolve(coll => {
                const relativeVel = this.vel.sub(coll.target.vel).project(coll.normal).rotate(coll.normal.normal().angle());
                // TODO: this makes the player unable to jump if they are standing on a box.
                // Need to fix this.
                this.vel = this.vel.reject(coll.normal);
            });
        },
    };
}
