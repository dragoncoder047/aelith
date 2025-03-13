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

export function bug(): BugComp {
    return {
        id: "bug",
        require: ["pos", "area", "sprite", "body", "state", "shader", "timer"],
        moveDir: Math.random() > 0.5 ? 1 : -1,
        footstepsCounter: 0,
        add(this: GameObj<BugComp | PosComp | AreaComp | BodyComp | StateComp | TimerComp | SpriteComp>) {
            // patch EnterState so it only transitions if the state will be changed!
            const oldEnterState = this.enterState;
            this.enterState = (state, ...args) => {
                if (this.state !== state) oldEnterState.call(this, state, ...args);
            };
            this.onPhysicsResolve(coll => {
                const obj = coll.target;
                if (obj.has("bug")) {
                    if (obj.state === "angry") this.enterState("angry");
                    else if (obj.state === "scared" || obj.state === "stunned" || this.state === "sleeping")
                        this.enterState("walking");
                }
                if (this.state === "sleeping" && obj !== player) return;
                if (coll?.isLeft() || coll?.isRight()) {
                    if (obj === player && this.state === "angry") {
                        player.hurt();
                        // apply knockback
                        this.applyImpulse(K.LEFT.scale(WALK_SPEED * this.moveDir).add(K.UP.scale(WALK_SPEED / 2)));
                        player.applyImpulse(K.RIGHT.scale(WALK_SPEED * this.moveDir).add(K.UP.scale(WALK_SPEED / 2)));
                    } else if (obj.isStatic && this.isGrounded()) {
                        this.moveDir *= -1;
                    }
                    if (obj === player) this.enterState("angry");
                    if (obj.has("bug") && ((coll?.isRight() && this.moveDir > 0 && obj.moveDir < 0) || obj.state === "sleeping"))
                        this.jump();
                }
            });
            this.onLand(obj => {
                if (obj.has("bug")) return;
                this.enterState("stunned");
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
            var wTimeout: TimerController | undefined;
            this.onStateEnter("walking", () => {
                wTimeout?.cancel();
                this.moveDir = this.flipX ? -1 : 1;
                this.play("walk");
                wTimeout = this.wait(15, () => this.enterState("sleeping"));
            });
            this.onStateEnd("walking", () => {
                wTimeout?.cancel();
            });
            this.onStateEnter("angry", () => {
                wTimeout?.cancel();
                this.moveDir = this.flipX ? -1 : 1;
                this.play("walk");
                wTimeout = this.wait(15, () => this.enterState("walking"));
            });
            this.onStateEnd("angry", () => {
                wTimeout?.cancel();
            });
            var stTimeout: TimerController | undefined;
            this.onStateEnter("stunned", () => {
                stTimeout?.cancel();
                this.moveDir = 0;
                this.play("stunned");
                stTimeout = this.wait(5, () => this.enterState("walking"));
            });
            this.onStateEnd("stunned", () => {
                stTimeout?.cancel();
            });
            this.onStateEnter("sleeping", () => {
                this.moveDir = 0;
                this.play("stand");
            });
            var scTimeout: TimerController | undefined;
            this.onStateEnter("scared", () => {
                scTimeout?.cancel();
                this.moveDir = 0;
                this.play("stand");
                this.collisionIgnore.add("player");
                scTimeout = this.wait(5, () => {
                    this.enterState(WorldManager.getLevelOf(this)!
                        .get<AreaComp>("portal")
                        .some(o => this.isColliding(o))
                        ? "walking"
                        : "sleeping");
                });
            });
            this.onStateUpdate("scared", () => {
                if (this.isGrounded()) this.jump();
            });
            this.onStateEnd("scared", () => {
                scTimeout?.cancel();
                this.collisionIgnore.delete("player");
            });
            this.on("interact", () => {
                this.enterState("scared");
            });
            this.on("portal", () => {
                this.enterState("scared");
            });
        },
        finish(this: GameObj<StateComp | SpriteComp | BugComp>) {
            this.flipX = this.moveDir < 0;
            this.enterState(this.state);
        },
        update(this: GameObj<BugComp | PosComp | SpriteComp | ShaderComp | StateComp | BodyComp>) {
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
