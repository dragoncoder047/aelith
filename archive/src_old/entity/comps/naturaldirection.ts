import { Comp, GameObj, RotateComp, ScaleComp } from "kaplay";
import { K } from "../../../src/context";
import { XY } from "../../../src/utils/JSON";

export function naturalDirection(dir: XY): Comp {
    const a = K.Vec2.deserialize(dir).angle();
    var oFlipX: number, oFlipY: number, fFlipX: number, fFlipY: number;
    var d: number;
    return {
        id: "naturalDirection",
        require: ["scale", "rotate"],
        add(this: GameObj<ScaleComp | RotateComp>) {
            oFlipX = this.scale.x;
            oFlipY = this.scale.y;
            fFlipX = Math.abs(a) < 90 ? -oFlipX : oFlipX;
            fFlipY = Math.abs(a) < 90 ? oFlipY : -oFlipY;
        },
        draw(this: GameObj<ScaleComp | RotateComp>) {
            d = (360 + this.transform.getRotation() - a) % 360;
            if (d > 180) this.scaleTo(fFlipX, fFlipY);
            else this.scaleTo(oFlipX, oFlipY);
        },
        inspect() {
            return `natural direction ${a}, x=${fFlipX}, y=${fFlipY}, d=${d}`;
        }
    };
}
