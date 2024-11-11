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

export interface CollisionerComp extends Comp {
    onDelay: number,
    offDelay: number | "toggle",
    switchMessage: string,
    collisioningWith: Set<GameObj>,
    ignoreTriggerTimeout: number,
}

export function collisioner(onDelay: number = 0, offDelay: number | "toggle" = 0, switchMessage: string = "toggle"): CollisionerComp {
    var collisioner: KEventController | undefined;
    var unCollisioner: KEventController | undefined;
    return {
        id: "collisioner",
        require: ["linked", "state", "timer", "body", "area"],
        onDelay,
        offDelay,
        switchMessage,
        collisioningWith: new Set(),
        ignoreTriggerTimeout: 0,
        add(this: GameObj<StateComp | TimerComp | AreaComp | BodyComp | CollisionerComp | LinkComp>) {
            this.on("collisionerUpdate", ([obj, normal]) => {
                if (this.collisioningWith.has(obj)) return;
                this.collisioningWith.add(obj);
                if (this.ignoreTriggerTimeout > 0) return;
                this.trigger("collisionerStart", [obj, normal]);
                if (unCollisioner) {
                    unCollisioner.cancel();
                    unCollisioner = undefined;
                }
                else {
                    if (collisioner) collisioner.cancel();
                    const shouldSwitch = this.collisioningWith.size === 1;
                    collisioner = this.wait(this.onDelay, () => {
                        collisioner = undefined;
                        if (shouldSwitch) this.broadcast(this.switchMessage);
                        if (typeof this.offDelay === "number" && this.offDelay < 0)
                            this.trigger("collisionerEnd", obj);
                    });
                }
            });
            this.on("collisionerEnd", obj => {
                if (!this.collisioningWith.has(obj)) return;
                this.collisioningWith.delete(obj);
                if (this.ignoreTriggerTimeout > 0) return;
                if (collisioner) {
                    collisioner.cancel();
                    collisioner = undefined;
                }
                else {
                    if (unCollisioner) unCollisioner.cancel();
                    const shouldSwitch = this.collisioningWith.size === 0;
                    if (this.offDelay === "toggle") return;
                    unCollisioner = this.wait(Math.abs(this.offDelay), () => {
                        unCollisioner = undefined;
                        if (shouldSwitch) this.broadcast(this.switchMessage);
                    });
                }
            });
        },
        fixedUpdate() {
            if (this.ignoreTriggerTimeout > 0)
                this.ignoreTriggerTimeout--;
        },
        inspect() {
            return `collisioning with ${this.collisioningWith.size} objects`
        }
    };
}
