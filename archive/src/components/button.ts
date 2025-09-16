import {
    AreaComp,
    BodyComp,
    Comp,
    GameObj
} from "kaplay";

export interface ButtonComp extends Comp {
}

export function button(): ButtonComp {
    return {
        id: "button",
        require: ["collisioner"],
        add(this: GameObj<AreaComp | BodyComp | ButtonComp>) {
            this.on("collisionerStart", ([obj, normal]) => {
                obj.vel = obj.vel.reject(normal);
            });
            this.onPhysicsResolve(coll => {
                if (!coll.isTop()) return;
                const obj = coll.target;
                this.trigger("collisionerUpdate", [obj, coll.normal]);
            });
            this.onCollideEnd(obj => {
                this.trigger("collisionerEnd", obj);
            });
        },
    };
}
