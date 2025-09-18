import { DrawCircleOpt, DrawEllipseOpt, DrawLinesOpt, DrawPolygonOpt, DrawRectOpt, DrawSpriteOpt, DrawTextOpt, Mask } from "kaplay";
import { K } from "../context";
import { STYLES } from "../TextStyles";

type PrimitiveOptMap = {
    sprite: DrawSpriteOpt,
    rect: DrawRectOpt,
    circle: DrawCircleOpt,
    ellipse: DrawEllipseOpt,
    polygon: DrawPolygonOpt,
    polyline: DrawLinesOpt,
    text: DrawTextOpt,
}

export interface Primitive<K extends keyof PrimitiveOptMap> {
    kind: K;
    opt: PrimitiveOptMap[K];
    mask?: Mask,
}

export function drawPrimitive(primitive: Primitive<any>) {
    switch (primitive.kind) {
        case "sprite": return K.drawSprite(primitive.opt);
        case "rect": return K.drawRect(primitive.opt);
        case "circle": return K.drawCircle(primitive.opt);
        case "ellipse": return K.drawEllipse(primitive.opt);
        case "polygon": return K.drawPolygon(primitive.opt);
        case "polyline": return K.drawLines(primitive.opt);
        case "text": return K.drawText({ ...primitive.opt, styles: STYLES });
    }
}
