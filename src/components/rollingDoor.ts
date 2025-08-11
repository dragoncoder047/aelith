import { AnchorComp, AreaComp, BodyComp, Comp, GameObj, PosComp, RectComp, RotateComp, SpriteComp, StateComp, TimerComp } from "kaplay";
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
    var oHeight = 0;
    return {
        id: "rolling-door",
        require: ["state", "area", "body", "pos", "sprite", "toggler", "interactable", "anchor"],
        rollAmount: 0,
        add(this: GameObj<StateComp<(typeof states)[number]> | PosComp | InteractableComp | AreaComp | BodyComp | SpriteComp | TogglerComp | TimerComp | RollingDoorComp | AnchorComp | RotateComp>) {
            K.onLoad(() => {
                this.moveBy(K.vec2(0, -this.height / 2).rotate(this.angle));
                this.anchor = "top";
                oHeight = this.height;
            });
            // create it to be manipulateable
            this.quad = K.quad(0, 0, 1, 1);
            this.onStateEnter(states[0], () => {
                this.target1Hint = "&msg.ctlHint.item.door.knock";
                this.tween(this.rollAmount, 0, 1, val => this.rollAmount = val, K.easings.easeOutBounce);
            });
            this.onStateEnter(states[1], () => {
                this.target1Hint = undefined;
                const tRoll = ((this.height - 1) / this.height);
                this.tween(this.rollAmount, tRoll, Math.abs(this.rollAmount - tRoll), val => this.rollAmount = val);
                unrollTimer = 1;
            });
            this.onBeforePhysicsResolve(col => {
                if (this.state === states[1] && unrollTimer <= 0) col.preventResolution();
            });
            this.target1 = () => {
                if (this.state === states[1]) return false;
                player.playSound("knock", {}, this.pos);
                return true;
            };
            this.target1Hint = "&msg.ctlHint.item.door.knock";
        },
        update(this: GameObj<RollingDoorComp | RectComp | PosComp | SpriteComp | AreaComp>) {
            if (unrollTimer > 0) unrollTimer -= K.dt();
            // Manipulate quad to make rolling effect
            this.quad.y = this.rollAmount;
            this.quad.h = 1 - this.rollAmount;
            this.height = oHeight * (1 - this.rollAmount);
            this.area.scale.y = 1 / (1 - this.rollAmount);
        }
    };
}
