import { AreaComp, BodyComp, Comp, GameObj, PosComp, ShaderComp, SpriteComp, StateComp, TimerComp, TimerController } from "kaplay";
import { FOOTSTEP_INTERVAL, WALK_SPEED } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { WorldManager } from "../levels";

export interface BugComp extends Comp {
    moveDir: number
    finish(): void
    footstepsCounter: 0,
}

type BugStates = "walking" | "sleeping" | "angry" | "stunned" | "scared";
export function bug(): BugComp {
    return {
        id: "bug",
        require: ["pos", "area", "sprite", "body", "state", "shader", "timer"],
        moveDir: Math.random() > 0.5 ? 1 : -1,
        footstepsCounter: 0,
        add(this: GameObj<BugComp | PosComp | AreaComp | BodyComp | StateComp<BugStates> | TimerComp | SpriteComp>) {
            // Ugly hack to prevent loading twice
            if ((this as any)._hasBug) return;
            (this as any)._hasBug = true;
            const enterNewState: (...x: Parameters<StateComp<BugStates>["enterState"]>) => void = (state, ...args) => {
                if (this.state !== state) this.enterState(state, ...args);
            };
            const changeStateAfter = (timeout: number, state: BugStates | (() => BugStates)) => {
                const ec: TimerController = this.wait(timeout, () => {
                    enterNewState(typeof state === "string" ? state : state());
                });
                this.onStateEnd(this.state, () => {
                    ec.cancel();
                    return K.cancel();
                });
            };
            this.onCollide((obj, coll) => {
                if (obj.has("bug")) {
                    if (obj.state === "angry") enterNewState("angry");
                    else if (obj.state === "scared" || obj.state === "stunned" || this.state === "sleeping")
                        enterNewState("walking");
                }
                if (this.state === "sleeping" && obj !== player) return;
                if (coll?.isLeft() || coll?.isRight()) {
                    if (obj === player && this.state === "angry") {
                        player.hp--;
                        // apply knockback
                        this.applyImpulse(K.LEFT.scale(WALK_SPEED * this.moveDir).add(K.UP.scale(WALK_SPEED / 2)));
                        player.applyImpulse(K.RIGHT.scale(WALK_SPEED * this.moveDir).add(K.UP.scale(WALK_SPEED / 2)));
                    } else if (obj.isStatic && this.isGrounded()) {
                        this.moveDir *= -1;
                    }
                    if (obj === player) enterNewState("angry");
                    if (obj.has("bug") && ((coll?.isRight() && this.moveDir > 0 && obj.moveDir < 0) || obj.state === "sleeping"))
                        this.jump();
                }
            });
            this.onLand(obj => {
                if (obj.has("bug")) return;
                enterNewState("stunned");
                if (obj === player) this.trigger("stomped_by_player");
            })
            this.onFallOff(() => {
                if (this.state === "sleeping") return;
                this.play("stand");
                this.moveDir *= -1;
                this.jump();
                this.applyImpulse(K.RIGHT.scale(this.moveDir * 10));
            });
            this.onGround(() => {
                if (this.moveDir !== 0) this.play("walk");
            });
            this.onStateEnter("walking", () => {
                this.moveDir = this.flipX ? -1 : 1;
                this.play("walk");
                changeStateAfter(15, "sleeping");
            });
            this.onStateEnter("angry", () => {
                this.moveDir = this.flipX ? -1 : 1;
                this.play("walk");
                changeStateAfter(15, "walking");
            });
            this.onStateEnter("stunned", () => {
                this.moveDir = 0;
                this.play("stunned");
                changeStateAfter(5, "walking");
            });
            this.onStateEnter("sleeping", () => {
                this.moveDir = 0;
                this.play("stand");
            });
            this.onStateEnter("scared", () => {
                this.moveDir = 0;
                this.play("stand");
                this.collisionIgnore.push("player");
                changeStateAfter(5, () => {
                    return WorldManager.getLevelOf(this)!
                        .get<AreaComp>("portal")
                        .some(o => this.isColliding(o))
                        ? "walking"
                        : "sleeping";
                });
            });
            this.onStateUpdate("scared", () => {
                if (this.isGrounded()) this.jump();
            });
            this.onStateEnd("scared", () => {
                this.collisionIgnore = this.collisionIgnore.filter(t => t !== "player");
            });
            this.on("interact", () => {
                enterNewState("scared");
            });
            this.on("portal", () => {
                enterNewState("scared");
            });
        },
        finish(this: GameObj<StateComp<BugStates> | SpriteComp | BugComp>) {
            this.flipX = this.moveDir < 0;
            this.enterState(this.state);
        },
        update(this: GameObj<BugComp | PosComp | SpriteComp | ShaderComp | StateComp<BugStates> | BodyComp>) {
            if (this.isGrounded()) this.move(WALK_SPEED / 3 * this.moveDir, 0);
            if (this.moveDir !== 0) this.flipX = this.moveDir < 0;
            this.animSpeed = Math.abs(this.moveDir);
            switch (this.state) {
                case "walking":
                    this.uniform!.u_targetcolor = K.GREEN;
                    break;
                case "angry":
                    this.uniform!.u_targetcolor = K.RED;
                    break;
                case "scared":
                    this.uniform!.u_targetcolor = K.BLUE;
                    break;
                case "stunned":
                    this.uniform!.u_targetcolor = K.YELLOW;
                    break;
                case "sleeping":
                    this.uniform!.u_targetcolor = K.WHITE.darken(127);
                    break;
            }
            const isMoving = this.moveDir !== 0 && this.isGrounded();
            this.footstepsCounter += K.dt() * this.animSpeed * +isMoving;
            if (this.footstepsCounter > FOOTSTEP_INTERVAL) {
                this.footstepsCounter = 0;
                player.playSound("bug_footsteps", undefined, this.pos);
            }
        },
    };
}
