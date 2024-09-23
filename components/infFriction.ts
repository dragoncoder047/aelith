import { BodyComp, GameObj } from 'kaplay';
import K from '../init';

export function infFriction() {
    return {
        add(this: GameObj<BodyComp>) {
            this.onPhysicsResolve(coll => {
                if (coll.target.is("surfaceEffector") && coll.isBottom()) {
                    this.vel = this.vel.reject(K.RIGHT).add(K.RIGHT.scale(coll.target.speed));
                }
            });
        },
        update(this: GameObj<BodyComp>) {
            if (this.curPlatform()?.is("wall")) {
                this.vel = this.vel.reject(K.RIGHT);
            }
        },
    };
}
