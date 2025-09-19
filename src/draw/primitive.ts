import { Anchor, LineCap, LineJoin, Outline, TextAlign, Uniform } from "kaplay";
import { K } from "../context";
import { XY } from "../DataPackFormat";
import { STYLES } from "../TextStyles";

type JSONUniform = Record<string, number | XY | string | string[]>

type BaseRenderProps = {
    pos?: XY;
    scale?: XY;
    angle?: number;
    skew?: XY;
    color?: string;
    opacity?: number;
    shader?: string;
    uniform?: JSONUniform;
    blend?: "+" | "*" | "screen" | "overlay";
    anchor?: Anchor | XY;
    outline?: {
        width?: number;
        color?: string;
        opacity?: number;
        join?: LineJoin;
        miterLimit?: number;
        cap?: LineCap;
    }
}

type RectangularOpt = {
    size?: [width: number | undefined, height: number],
}

type SpritePrimitive = BaseRenderProps & RectangularOpt & {
    kind: "sprite",
    sprite: string,
    frame?: number,
    tiled?: boolean,
    flip?: [x: boolean, y: boolean],
};

type ShapeOpt = {
    fill?: boolean,
}

type RectPrimitive = BaseRenderProps & RectangularOpt & ShapeOpt & {
    kind: "rect",
};

type CirclePrimitive = BaseRenderProps & ShapeOpt & {
    kind: "circle",
    r: number,
    pie?: [start: number, end: number],
};

type EllipsePrimitive = BaseRenderProps & ShapeOpt & {
    kind: "ellipse",
    r: XY,
    pie?: [start: number, end: number],
};

type PolygonPrimitive = BaseRenderProps & ShapeOpt & {
    kind: "polygon",
    pts: XY[],
};

type TextTransform = {
    pos?: XY;
    scale?: XY | number;
    angle?: number;
    color?: string;
    opacity?: number;
    override?: boolean;
    font?: string;
    stretchInPlace?: boolean;
    shader?: string;
    uniform?: JSONUniform;
}

type TextPrimitive = BaseRenderProps & {
    kind: "text",
    text: string,
    size?: number,
    width?: number,
    align?: TextAlign,
    gap?: [letter: number, line: number],
    transform?: TextTransform,
    styles?: Record<string, TextTransform>,
};

export type Primitive =
    | SpritePrimitive
    | RectPrimitive
    | CirclePrimitive
    | EllipsePrimitive
    | PolygonPrimitive
    | TextPrimitive;

export function drawPrimitive(uid: number, primitive: Primitive) {
    switch (primitive.kind) {
        case "sprite":
            return K.drawSprite(addBaseProps(uid, primitive, {
                sprite: primitive.sprite,
                frame: primitive.frame,
                tiled: primitive.tiled,
                width: primitive.size?.[0],
                height: primitive.size?.[1],
                flipX: primitive.flip?.[0],
                flipY: primitive.flip?.[1],
            }));
        case "rect":
            return K.drawRect(addBaseProps(uid, primitive, {
                width: primitive.size?.[0],
                height: primitive.size?.[1],
                fill: primitive.fill,
            }));
        case "circle":
            return K.drawCircle(addBaseProps(uid, primitive, {
                radius: primitive.r,
                fill: primitive.fill,
                start: primitive.pie?.[0],
                end: primitive.pie?.[1],
            }));
        case "ellipse":
            return K.drawEllipse(addBaseProps(uid, primitive, {
                radiusX: primitive.r?.[0],
                radiusY: primitive.r?.[1],
                fill: primitive.fill,
                start: primitive.pie?.[0],
                end: primitive.pie?.[1],
            }));
        case "polygon":
            return K.drawPolygon(addBaseProps(uid, primitive, {
                pts: primitive.pts.map(([x, y]) => K.vec2(x, y)),
                fill: primitive.fill
            }));
        case "text":
            return K.drawText(addBaseProps(uid, primitive, {
                styles: Object.assign({}, STYLES, primitive.styles),
                transform: Object.assign({}, STYLES.default, primitive.transform),
                text: K.sub(primitive.text),
                size: primitive.size,
                width: primitive.width,
                align: primitive.align,
                letterSpacing: primitive.gap?.[0],
                lineSpacing: primitive.gap?.[1],
            }));
        default:
            primitive satisfies never;
            throw new Error(`unknown primitive type ${JSON.stringify((primitive as any).kind)}`);
    }
}

function addBaseProps<T>(uid: number, p: Primitive, props: Partial<T>): T {
    const q = props as any;
    if (p.pos) q.pos = K.vec2(p.pos[0], p.pos[1]);
    if (p.scale) q.scale = K.vec2(p.scale[0], p.scale[1]);
    if (p.angle) q.angle = p.angle;
    if (p.skew) q.skew = K.vec2(p.skew[0], p.skew[1]);
    if (p.color) q.color = K.rgb(p.color);
    if (p.opacity) q.opacity = p.opacity;
    if (p.shader) q.shader = p.shader;
    if (p.uniform) {
        const uv = {} as Uniform;
        q.uniform = uv;
        for (var u in p.uniform) {
            const v = p.uniform[u]!;
            switch (typeof v) {
                case "string": switch (v) {
                    case "time": uv[u] = K.time(); break;
                    case "staticrand": uv[u] = uid; break;
                    default: uv[u] = K.rgb(v);
                } break;
                case "number": uv[v] = v; break;
                default: switch (typeof v[0]) {
                    case "string": uv[u] = v.map(c => K.rgb(c as string)); break;
                    case "number": uv[u] = K.vec2(v[0], v[1] as number); break;
                    default:
                        throw new Error("unknown uniform type " + JSON.stringify(v));
                }
            }
        }
    }
    if (p.blend) q.blend = { "*": K.BlendMode.Multiply, "+": K.BlendMode.Add, "screen": K.BlendMode.Screen, "overlay": K.BlendMode.Overlay }[p.blend] ?? p.blend;
    if (p.anchor) q.anchor = typeof p.anchor === "string" ? p.anchor : K.vec2(p.anchor[0], p.anchor[1]);
    if (p.outline) {
        const o = p.outline;
        const qo = {} as Outline;
        q.outline = qo;
        if (o.width) qo.width = o.width;
        if (o.color) qo.color = K.rgb(o.color);
        if (o.opacity) qo.opacity = o.opacity;
        if (o.join) qo.join = o.join;
        if (o.miterLimit) qo.miterLimit = o.miterLimit;
        if (o.cap) qo.cap = o.cap;
    }
    return props as T;
};
