import { BodyComp, Comp, GameObj, PosComp, RotateComp, SpriteComp, Vec2 } from "kaplay";
import { player } from ".";
import { K } from "../init";

export interface PlayerHeadComp extends Comp {
}

const NORMAL_POS = K.vec2(0, -25);

export function playerHead(): PlayerHeadComp {
    return {
        id: "player-head",
        require: ["pos", "sprite", "rotate", "body"],
        update(this: GameObj<PlayerHeadComp | PosComp | SpriteComp | RotateComp | BodyComp>) {
            const anim = player.getCurAnim();
            // track the motion of the body
            this.pos = NORMAL_POS.add((player.lookingDirection !== undefined ? player.lookingDirection.x > 0 : player.flipX) ? 2 : -2, 0);
            this.vel = K.vec2(0);

            // track the rotation of the head
            if (player.lookingDirection !== undefined) {
                const a = player.lookingDirection.angle() + 180;
                this.angle = a > 270 ? (a > 315 ? a : 315) : (a > 225 ? 225 : a);
                this.flipY = a > 90 && a < 270;
                this.flipX = false;
            } else {
                this.angle = 0;
                this.flipX = player.flipX;
                this.flipY = false;
            }
        },
    }
}