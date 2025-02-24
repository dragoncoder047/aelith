import { AreaComp, GameObj, KAPLAYCtx } from "kaplay";
import { World } from "planck";
import type { KAPLAYPlanckPluginOpt } from ".";

export function initWorld(K: KAPLAYCtx, opt: KAPLAYPlanckPluginOpt): World {
    const world = new World;
    world.on("pre-solve", (contact, oldManifold) => {
        const bodyA: GameObj<AreaComp> = contact.getFixtureA().getBody().getUserData() as any;
        const bodyB: GameObj<AreaComp> = contact.getFixtureB().getBody().getUserData() as any;
        if (bodyA.is("platformEffector") || bodyA.is("surfaceEffector")) {
            bodyA.trigger("collision_pre_solve", bodyB, contact, oldManifold);
        }
        if (bodyB.is("platformEffector") || bodyB.is("surfaceEffector")) {
            bodyB.trigger("collision_pre_solve", bodyA, contact, oldManifold);
        }
    });
    world.on("begin-contact", contact => {
        const bodyA: GameObj<AreaComp> = contact.getFixtureA().getBody().getUserData() as any;
        const bodyB: GameObj<AreaComp> = contact.getFixtureB().getBody().getUserData() as any;
        bodyA.trigger("collide", bodyB)
        bodyB.trigger("collide", bodyA)
    })

    world.on("end-contact", contact => {
        const bodyA: GameObj<AreaComp> = contact.getFixtureA().getBody().getUserData() as any;
        const bodyB: GameObj<AreaComp> = contact.getFixtureB().getBody().getUserData() as any;
        bodyA.trigger("collideEnd", bodyB)
        bodyB.trigger("collideEnd", bodyA)
    })
    K.system("collision", () => {
        world.step(K.fixedDt(), opt.velIter ?? 10, opt.posIter ?? 8);
    }, [4]); // 4 == AfterFixedUpdate
    return world;
}
