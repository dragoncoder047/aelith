import { AreaComp, BodyComp, Comp, GameObj, PosComp, ShaderComp, SpriteComp, StateComp, TimerComp } from "kaplay";
import { FOOTSTEP_INTERVAL, WALK_SPEED } from "../constants";
import { K } from "../init";
import { player } from "../player";

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
            this.onPhysicsResolve(coll => {
                const obj = coll.target;
                if (obj.has("bug")) {
                    if (obj.state === "angry") this.enterState("angry");
                    else if (obj.state === "scared" || this.state === "sleeping") this.enterState("walking");
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
                } else if (coll?.isTop() && !obj.has("bug") && !obj.isStatic) {
                    this.enterState("scared");
                }
            });
            this.onFallOff(() => {
                if (this.state === "sleeping") return;
                this.play("stand");
                this.moveDir *= -1;
                this.jump();
                this.applyImpulse(K.RIGHT.scale(this.moveDir * 10));
            });
            this.onGround(() => {
                if (this.state !== "sleeping") this.play("walk");
            });
            this.onStateEnter("scared", () => {
                this.moveDir *= 2;
                this.wait(5, () => {
                    if (this.state === "scared") this.enterState("walking");
                });
            });
            this.onStateEnd("scared", () => {
                this.moveDir /= 2;
            });
            this.onStateEnter("sleeping", () => {
                this.moveDir = 0;
                this.play("stand");
            });
            this.onStateEnd("sleeping", () => {
                this.moveDir = this.flipX ? -1 : 1;
                this.play("walk");
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
