import K from '../init.js';

export function infFriction() {
    return {
        add() {
            this.onPhysicsResolve(coll => {
                if (coll.target.is("surfaceEffector") && coll.isBottom()) {
                    this.vel = this.vel.reject(K.RIGHT).add(K.RIGHT.scale(coll.target.speed));
                }
            });
        },
        update() {
            if (this.curPlatform()?.is("wall")) {
                this.vel = this.vel.reject(K.RIGHT);
            }
        },
    };
}
