import { Comp, GameObj, RotateComp, SpriteComp } from "kaplay";
import { K } from "../../context";
import { XY } from "../../DataPackFormat";

export function naturalDirection(dir: XY): Comp {
    const a = K.vec2(...dir).angle();
    var oFlipX: boolean, oFlipY: boolean, fFlipX: boolean, fFlipY: boolean;
    var d: number;
    return {
        id: "naturalDirection",
        require: ["sprite", "rotate"],
        add(this: GameObj<SpriteComp | RotateComp>) {
            oFlipX = this.flipX;
            oFlipY = this.flipY;
            fFlipX = Math.abs(a) < 90 ? !oFlipX : oFlipX;
            fFlipY = Math.abs(a) < 90 ? oFlipY : !oFlipY;
        },
        update(this: GameObj<SpriteComp | RotateComp>) {
            d = (360 + this.transform.getRotation() - a) % 360;
            if (d > 180) {
                this.flipX = fFlipX;
                this.flipY = fFlipY;
            } else {
                this.flipX = oFlipX;
                this.flipY = oFlipY;
            }
        },
        inspect() {
            return `natural direction ${a}, x=${fFlipX}, y=${fFlipY}, d=${d}`;
        }
    };
}
