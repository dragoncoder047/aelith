import { KAPLAYCtx, KAPLAYPlugin, Vec2 } from "kaplay";
import { Vec2 as PVec2, World } from "planck";
import { initWorld } from "./world";
import { P_BodyComp, P_BodyCompOpt, rigidBody } from "./body";

export interface KAPLAYPlanckPlugin {
    area(opt: P_AreaCompOpt): P_AreaComp;
    body(opt: P_BodyCompOpt): P_BodyComp;
    platformEffector(opt: P_PlatformEffectorCompOpt): P_PlatformEffectorComp;
    surfaceEffector(opt: P_SurfaceEffectorCompOpt): P_SurfaceEffectorComp;
    areaEffector(opt: P_AreaEffectorCompOpt): P_AreaEffectorComp;
    // TODO: joints
    getGravity(): Vec2;
    setGravity(g: Vec2): void;
    physics: {
        p2k(pv: PVec2): Vec2;
        k2p(kv: Vec2): PVec2;
        world: World,
    }
}

export interface KAPLAYPlanckPluginOpt {
    pixelsPerMeter: number;
    velIter?: number;
    posIter?: number;
}

export function kaplayPlanck(opt: KAPLAYPlanckPluginOpt): KAPLAYPlugin<KAPLAYPlanckPlugin> {
    return ((K: KAPLAYCtx & KAPLAYPlanckPlugin) => {
        const world: World = initWorld(K, opt);
        const p: KAPLAYPlanckPlugin = {
            physics: {
                world,
                p2k(pv) {
                    return K.vec2(pv.mul(opt.pixelsPerMeter) as any);
                },
                k2p(kv) {
                    return new PVec2(kv.scale(1 / opt.pixelsPerMeter));
                }
            },
            setGravity(g) {
                world.setGravity(K.physics.k2p(g));
            },
            getGravity() {
                return K.physics.p2k(world.getGravity());
            },
            body: rigidBody(K),
        };
        return p;
    }) as any;
}
