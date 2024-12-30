import { BodyComp, Comp, GameObj, PosComp, RotateComp, SpriteComp, Vec2 } from "kaplay";
import { player } from ".";
import { K } from "../init";

export interface PlayerHeadComp extends Comp {
}

const HEAD_OFFSET = K.vec2(0, -25);
const OFFSET_TAB = {
    idle: [K.vec2(0)],
    walking: new Array(8).fill(1).map((_, i) => K.vec2(0, i == 2 || i == 6 ? 1 : 0)),
    jump: new Array(4).fill(1).map((_, i) => K.vec2(0, i + 1)),
    climbing: new Array(4).fill(1).map(_ => K.vec2(0)),
} as Record<string, Vec2[]>;

export function playerHead(): PlayerHeadComp {
    return {
        id: "player-head",
        require: ["pos", "sprite", "rotate", "body"],
        fixedUpdate(this: GameObj<PlayerHeadComp | PosComp | SpriteComp | RotateComp | BodyComp>) {
            // track the motion of the body
            const targetPos = HEAD_OFFSET.add(player.pos).add((player.lookingDirection !== undefined ? player.lookingDirection.x > 0 : player.flipX) ? 2 : -2, 0);
            var offset = K.vec2(0);
            const anim = player.getCurAnim();
            if (anim !== null) {
                offset = OFFSET_TAB[anim.name]?.[player.animFrame]!;
            }
            this.pos = targetPos.add(offset);
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

            // copy the anim
            if (this.getCurAnim()?.name !== anim?.name) this.play(anim!.name);
        },
    }
}
