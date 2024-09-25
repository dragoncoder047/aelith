import { BodyComp, Comp, GameObj, Tag } from "kaplay";
import { K } from "../init";

export interface InfiniteFrictionComp extends Comp {
    infFrictionTags: Tag[]
}

export function infFriction(infFrictionTags: Tag[] = ["wall", "box"]): InfiniteFrictionComp {
    return {
        infFrictionTags,
        add(this: GameObj<BodyComp>) {
            this.onPhysicsResolve(coll => {
                if (coll.target.is("surfaceEffector") && coll.isBottom()) {
                    this.vel = this.vel.reject(K.RIGHT).add(K.RIGHT.scale(coll.target.speed));
                }
            });
        },
        update(this: GameObj<BodyComp | InfiniteFrictionComp>) {
            if (this.infFrictionTags.some(t => this.curPlatform()?.is(t))) {
                this.vel = this.vel.reject(K.RIGHT);
            }
        },
    };
}
