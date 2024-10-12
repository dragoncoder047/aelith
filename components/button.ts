import {
    AreaComp,
    BodyComp,
    Comp,
    GameObj,
    KEventController,
    StateComp,
    TimerComp
} from "kaplay";
import { LinkComp } from "./linked";
import { K } from "../init";

export interface ButtonComp extends Comp {
    onDelay: number,
    offDelay: number | "toggle",
    switchMessage: string,
    stompedBy: Set<GameObj>,
}

/**
 * Enables the object to turn on and off when it is stomped
 * @param onDelay delay to turn on when initially stomped
 * @param offDelay delay to turn off when unstomped
 * * "toggle" means it is a bistable toggle (stomp on, stomp off)
 * * negative delay means that it will automatically turn off after delay even if the stomping object is still on it
 * @param switchMessage message used to toggle state
 */
export function button(onDelay: number = 0, offDelay: number | "toggle" = 0, switchMessage: string = "toggle"): ButtonComp {
    var stompedTimer: KEventController | undefined;
    var unstompedTimer: KEventController | undefined;
    // cSpell: ignore unstomped
    return {
        id: "button",
        require: ["linked", "state", "timer", "body", "area"],
        onDelay,
        offDelay,
        switchMessage,
        stompedBy: new Set(),
        add(this: GameObj<StateComp | TimerComp | AreaComp | BodyComp | ButtonComp | LinkComp>) {
            this.onPhysicsResolve(coll => {
                if (!coll.isTop()) return;
                const obj = coll.target;
                if (this.stompedBy.has(obj)) return;
                obj.vel = K.vec2(0);
                if (unstompedTimer) {
                    unstompedTimer.cancel();
                    unstompedTimer = undefined;
                }
                else {
                    if (stompedTimer) stompedTimer.cancel();
                    const shouldSwitch = this.stompedBy.size === 0;
                    this.stompedBy.add(obj);
                    stompedTimer = this.wait(this.onDelay, () => {
                        stompedTimer = undefined;
                        if (shouldSwitch) this.broadcast(this.switchMessage);
                        if (typeof this.offDelay === "number" && this.offDelay < 0)
                            this.trigger("collideEnd", obj);
                    });
                }
            });
            this.onCollideEnd(obj => {
                if (!this.stompedBy.has(obj)) return;
                if (stompedTimer) {
                    stompedTimer.cancel();
                    stompedTimer = undefined;
                }
                else {
                    if (unstompedTimer) unstompedTimer.cancel();
                    this.stompedBy.delete(obj);
                    const shouldSwitch = this.stompedBy.size === 0;
                    if (this.offDelay === "toggle") return;
                    unstompedTimer = this.wait(Math.abs(this.offDelay), () => {
                        unstompedTimer = undefined;
                        if (shouldSwitch) this.broadcast(this.switchMessage);
                    });
                }
            });
        }
    };
}
