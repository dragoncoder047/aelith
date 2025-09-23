import { Anchor, GameObj, LineCap, LineJoin, Outline, TextAlign, Uniform } from "kaplay";
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
    },
    layer?: string;
    z?: number;
    mask?: "&" | "-";
}

type RectangularOpt = {
    size?: [width: number | undefined, height: number],
}

type SpritePrimitive = BaseRenderProps & RectangularOpt & {
    as: "sprite",
    sprite: string,
    frame?: number,
    tiled?: boolean,
    flip?: [x: boolean, y: boolean],
};

type ShapeOpt = {
    fill?: boolean,
}

type RectPrimitive = BaseRenderProps & RectangularOpt & ShapeOpt & {
    as: "rect",
};

type CirclePrimitive = BaseRenderProps & ShapeOpt & {
    as: "circle",
    r: number,
};

type EllipsePrimitive = BaseRenderProps & ShapeOpt & {
    as: "ellipse",
    r: XY,
};

type PolygonPrimitive = BaseRenderProps & ShapeOpt & {
    as: "polygon",
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
    as: "text",
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

export function addRenderComps(obj: GameObj, uid: number, primitive: Primitive) {
    addBaseProps(obj, uid, primitive);
    switch (primitive.as) {
        case "sprite":
            obj.use(K.sprite(primitive.sprite, {
                frame: primitive.frame,
                tiled: primitive.tiled,
                width: primitive.size?.[0],
                height: primitive.size?.[1],
                flipX: primitive.flip?.[0],
                flipY: primitive.flip?.[1],
            })); break;
        case "rect":
            obj.use(K.rect(primitive.size?.[0]!, primitive.size?.[1]!, {
                fill: primitive.fill
            })); break;
        case "circle":
            obj.use(K.circle(primitive.r, {
                fill: primitive.fill,
            })); break;
        case "ellipse":
            obj.use(K.ellipse(primitive.r?.[0], primitive.r?.[1])); break;
        case "polygon":
            obj.use(K.polygon(primitive.pts.map(([x, y]) => K.vec2(x, y)), {
                fill: primitive.fill
            })); break;
        case "text":
            obj.use(K.text("", {
                styles: Object.assign({}, STYLES, primitive.styles),
                transform: Object.assign({}, STYLES.default, primitive.transform),
                size: primitive.size,
                width: primitive.width,
                align: primitive.align,
                letterSpacing: primitive.gap?.[0],
                lineSpacing: primitive.gap?.[1],
            }));
            obj.use(K.dynamicText(primitive.text)); break;
        default:
            primitive satisfies never;
            throw new Error(`unknown primitive type ${JSON.stringify((primitive as any).kind)}`);
    }
}

function addBaseProps(obj: GameObj, uid: number, p: Primitive) {
    if (p.scale) obj.use(K.scale(p.scale[0], p.scale[1]));
    if (p.angle) obj.use(K.rotate(p.angle));
    if (p.skew) obj.use(K.skew(p.skew[0], p.skew[1]));
    if (p.color) obj.use(K.color(K.rgb(p.color)));
    if (p.opacity) obj.use(K.opacity(p.opacity));
    if (p.shader) {
        obj.use(K.shader(p.shader, () => {
            const uv = {} as Uniform;
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
            return uv
        }));
    }
    if (p.blend) obj.use(K.blend({ "*": K.BlendMode.Multiply, "+": K.BlendMode.Add, "screen": K.BlendMode.Screen, "overlay": K.BlendMode.Overlay }[p.blend]));
    if (p.anchor) obj.use(K.anchor(typeof p.anchor === "string" ? p.anchor : K.vec2(p.anchor[0], p.anchor[1])));
    if (p.outline) obj.use(K.outline(p.outline.width, K.rgb(p.outline.color!), p.outline.opacity, p.outline.join, p.outline.miterLimit, p.outline.cap));
    if (p.layer) obj.use(K.layer(p.layer));
    if (p.z) obj.use(K.z(p.z));
    if (p.mask) obj.use(K.mask({ "&": "intersect" as const, "-": "subtract" as const }[p.mask]));
}
