import { Comp, DrawLinesOpt, Shape, Vec2 } from "kaplay";
import { K } from "../context";

export interface PolylineComp extends Comp {
    renderArea(): Shape;
}

const EMPTY_POINT = new K.Point(K.vec2());
export function polyline(pts: Vec2[], opt: Omit<DrawLinesOpt, "pts">): PolylineComp {
    return {
        id: "polyline",
        draw() {
            K.drawLines({
                ...opt,
                pts,
            });
        },
        renderArea() {
            return EMPTY_POINT;
        }
    }
}
