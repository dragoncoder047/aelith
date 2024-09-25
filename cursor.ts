import { Comp, GameObj, PosComp, SpriteComp } from "kaplay";
import { K } from "./init";

import { player } from "./player";

/* -------- Cursor for interaction ------------- */

export interface CursorComp extends Comp {
    clampPos(): void,
    showInteractable(): void,
}

function cursorComp(): CursorComp {
    return {
        clampPos(this: GameObj<PosComp>) {
            // make sure cursor doesn't go outside of window (prevent "I lost my mouse!!!"")
            this.pos.x = Math.max(0, Math.min(this.pos.x, K.width()));
            this.pos.y = Math.max(0, Math.min(this.pos.y, K.height()));
        },
        showInteractable(this: GameObj<SpriteComp>) {
            // show interaction distance indicator
            const targeted = player.getTargeted();
            if (targeted !== undefined) {
                this.frame = 0;
                // this.area.scale = K.wave(0.8, 1.2, K.time());
            }
            else {
                // frame 1 is a little smaller and gray
                this.frame = 1;
                // this.area.scale = 1;
            }
        },
        update() {
            this.clampPos();
            this.showInteractable();
        }
    };
}

export const cursor = K.add([
    K.pos(),
    K.fixed(),
    K.sprite("cursor"),
    "cursor",
    K.anchor("center"),
    K.layer("ui"),
    K.color(),
    K.area({ scale: 0 }), // single point
    K.fakeMouse(),
    cursorComp(),
]);
