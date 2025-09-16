import type {
    AreaComp,
    AreaCompOpt,
    GameObj,
    KAPLAYCtx,
    Rect
} from "kaplay";


export interface PAreaComp extends AreaComp {
    aabb(): Rect;
};

export interface KAPLAYAABBPlugin {
    area(opt: AreaCompOpt): PAreaComp;
}

export function kaplayAABB(k: KAPLAYCtx): KAPLAYAABBPlugin {
    const oldAreaComp = k.area;
    return {
        area(opt) {
            const comp = oldAreaComp(opt) as PAreaComp;
            comp.aabb = function (this: GameObj<PAreaComp>) {
                return this.worldArea().bbox();
            }
            return comp;
        }
    }
}
