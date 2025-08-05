import { AreaComp, BodyComp, Comp, GameObj, PosComp, SpriteComp, StateComp, TimerComp } from "kaplay";
import { K } from "../init";
import { player } from "../player";
import { InteractableComp } from "./interactable";
import { TogglerComp } from "./toggler";


export interface RollingDoorComp extends Comp {
    rollAmount: number,
}

/**
 * Performs the "roll-up door" animation and changes collision stuff
 */
export function rollingDoor(states: [string, string] = ["off", "on"]): RollingDoorComp {
    var unrollTimer = 0;
    return {
        id: "rolling-door",
        require: ["state", "area", "body", "pos", "sprite", "toggler", "interactable"],
        rollAmount: 0,
        add(this: GameObj<StateComp<(typeof states)[number]> | PosComp | InteractableComp | AreaComp | BodyComp | SpriteComp | TogglerComp | TimerComp | RollingDoorComp>) {
            this.onStateEnter(states[0], () => {
                this.tween(this.rollAmount, 0, 1, val => this.rollAmount = val, K.easings.easeOutBounce);
            });
            this.onStateEnter(states[1], () => {
                const tRoll = -((this.height - 1) / this.height);
                this.tween(this.rollAmount, tRoll, Math.abs(this.rollAmount - tRoll), val => this.rollAmount = val);
                unrollTimer = 1;
            });
            K.onLoad(() => {
                const fq = K.getSprite(this.sprite)!.data!.frames[0]!
                this.use(K.shader("translate", () => {
                    return {
                        u_moveby: K.vec2(0, this.rollAmount),
                        u_quad_topleft: K.vec2(fq.x, fq.y),
                        u_quad_wh: K.vec2(fq.w, fq.h),
                    }
                }));
            });
            this.onBeforePhysicsResolve(col => {
                if (this.state === states[1] && unrollTimer <= 0) col.preventResolution();
            });
            this.target1 = () => {
                player.playSound("knock", {}, this.pos);
                return true;
            };
            this.target1Hint = "&msg.ctlHint.item.door.knock";
        },
        update() {
            if (unrollTimer > 0) unrollTimer -= K.dt();
        }
    };
}
