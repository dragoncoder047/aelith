import { AreaComp, Comp, GameObj, SpriteComp, StateComp, TimerComp, TweenController } from "kaplay";
import { TogglerComp } from "./toggler";
import { K } from "../init";


export interface RollingDoorComp extends Comp {
    rollAmount: number,
    tweener: TweenController | null
}

/**
 * Performs the "roll-up door" animation and changes collision stuff
 */
export function rollingDoor(states: [string, string] = ["off", "on"]): RollingDoorComp {
    return {
        id: "rolling-door",
        require: ["state", "area", "sprite", "toggler"],
        rollAmount: 0,
        tweener: null,
        add(this: GameObj<StateComp | AreaComp | SpriteComp | TogglerComp | TimerComp | RollingDoorComp>) {
            this.onStateEnter(states[0], () => {
                this.tweener?.cancel();
                this.tweener = this.tween(this.rollAmount, 0, 1, val => this.rollAmount = val, K.easings.easeOutBounce);
                this.collisionIgnore = this.collisionIgnore.filter(x => x != "*");
            });
            this.onStateEnter(states[1], () => {
                this.tweener?.cancel();
                this.tweener = this.tween(this.rollAmount, -1, Math.abs(this.rollAmount - (-1)), val => this.rollAmount = val, K.easings.linear);
                this.collisionIgnore.push("*");
            });
            K.onLoad(() => {
                const fq = K.getSprite(this.sprite)!.data!.frames[0]!
                K.debug.log(fq);
                this.use(K.shader("translateSprite", () => {
                    return {
                        u_moveby: K.vec2(0, this.rollAmount),
                        u_quad_topleft: K.vec2(fq.x, fq.y),
                        u_quad_wh: K.vec2(fq.w, fq.h),
                    }
                }));
            });
        },
    };
}
