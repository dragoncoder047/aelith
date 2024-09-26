import { BodyComp, Comp, GameObj, Tag } from "kaplay";

export interface CorrectPhysicsComp extends Comp {
}

/**
 * A fix for kaplayjs/kaplay#420
 */
export function correctPhysics(): CorrectPhysicsComp {
    return {
        require: ["body"],
        add(this: GameObj<BodyComp>) {
            this.onPhysicsResolve(coll => {
                this.vel = this.vel.reject(coll.normal);
            });
        },
    };
}
