import { Comp, GameObj, PosComp, SpriteComp, Tag } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";

interface Pseudo3DComp extends Comp {
}

const DEPTH = 0.1;
const COLOR_FACTOR = 5;
const IDENTITY_MATRIX = new K.Mat23();

export function pseudo3D(flip: boolean, tiled = true, steps = TILE_SIZE): Pseudo3DComp {
    return {
        id: "pseudo3D",
        require: ["sprite", "pos"],
        draw(this: GameObj<SpriteComp | PosComp>) {
            K.pushTransform();
            K.pushMatrix(IDENTITY_MATRIX);
            if (!flip || true) {
                // just draw a bunch of times in relation to the camera
                for (var i = steps - 1; i >= 0; i--) {
                    const t = DEPTH * i / steps;
                    const pos = K.lerp(this.worldPos()!, K.getCamPos(), t);
                    const scale = K.vec2(1 - t);
                    K.pushTranslate(pos);
                    K.pushScale(scale);
                    K.drawSprite({
                        ...this,
                        pos: K.vec2(0),
                        color: K.WHITE.darken(255 * t * COLOR_FACTOR),
                        tiled
                    });
                    K.pushScale(K.vec2(1).invScale(scale));
                    K.pushTranslate(pos.scale(-1));
                }
            }
            // chop polygons
            // top
            // bottom
            // left
            // right
            K.popTransform();
        }
    }
}
