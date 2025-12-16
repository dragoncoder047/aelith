import { Anchor, GameObj, LineCap, LineJoin, TextAlign, Uniform } from "kaplay";
import { K } from "../context";
import { XY } from "../DataPackFormat";
import { DEF_STYLES, STYLES } from "../TextStyles";
import { simpleParticles } from "./particle";
import { polyline } from "./polyline";
import * as GameManager from "../GameManager";

type JSONUniform = Record<string, number | number[] | XY | XY[] | string | string[]>

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

export type PolylinePrimitive = BaseRenderProps & {
    as: "polyline",
    pts: XY[],
    opacity?: number;
    width?: number;
    join?: LineJoin;
    miterLimit?: number;
    cap?: LineCap;
}

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
    font?: string;
};

export type ParticlePrimitive = BaseRenderProps & {
    as: "particles",
    time?: [number, number],
    speed?: [number, number],
    acc?: [XY, XY],
    damp?: [number, number],
    dir?: number,
    spin?: [number, number],
    anim?: {
        scale?: number[],
        color?: string[],
        trans?: number[],
    },
    sprite?: [string, number];
    pps: number;
    spread?: number,
};

export type Primitive =
    | SpritePrimitive
    | RectPrimitive
    | CirclePrimitive
    | EllipsePrimitive
    | PolygonPrimitive
    | PolylinePrimitive
    | TextPrimitive
    | ParticlePrimitive;

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
            obj.use(K.ellipse(primitive.r?.x, primitive.r?.y)); break;
        case "polygon":
            obj.use(K.polygon(primitive.pts.map(K.Vec2.deserialize), {
                fill: primitive.fill
            })); break;
        case "polyline":
            obj.use(polyline(primitive.pts.map(K.Vec2.deserialize), {
                width: primitive.width,
                join: primitive.join,
                cap: primitive.cap,
                miterLimit: primitive.miterLimit,
            })); break;
        case "text":
            obj.use(K.text("", {
                styles: Object.assign({}, STYLES, primitive.styles),
                transform: Object.assign({} as any, DEF_STYLES, primitive.transform),
                size: primitive.size,
                width: primitive.width,
                align: primitive.align,
                letterSpacing: primitive.gap?.[0],
                lineSpacing: primitive.gap?.[1],
                font: primitive.font ?? GameManager.getDefaultValue("font"),
            }));
            obj.use(K.dynamicText(primitive.text)); break;
        case "particles":
            obj.use(simpleParticles(primitive));
            break;
        default:
            primitive satisfies never;
    }
}

function addBaseProps(obj: GameObj, uid: number, p: Primitive) {
    if (p.scale) obj.use(K.scale(p.scale.x, p.scale.y));
    if (p.angle) obj.use(K.rotate(p.angle));
    if (p.skew) obj.use(K.skew(p.skew.x, p.skew.y));
    if (p.color) obj.use(K.color(K.rgb(p.color)));
    if (p.opacity) obj.use(K.opacity(p.opacity));
    if (p.shader) {
        const uv = {} as Uniform;
        for (var u in p.uniform) {
            const v = p.uniform[u]!;
            switch (typeof v) {
                case "string": switch (v) {
                    case "time": uv[u] = K.time(); obj.onUpdate(() => uv[u] = K.time()); break;
                    case "staticrand": uv[u] = uid; break;
                    default: uv[u] = K.rgb(v);
                } break;
                case "number": uv[u] = v; break;
                default: switch (Array.isArray(v) && typeof v[0]) {
                    case "string": uv[u] = (v as string[]).map(c => K.rgb(c as string)); break;
                    case "number": uv[u] = v as number[]; break;
                    case "object": uv[u] = (v as XY[]).map(K.Vec2.deserialize); break;
                    case false: uv[u] = K.Vec2.deserialize(v as XY); break;
                    default:
                        throw new Error("unknown uniform type " + JSON.stringify(v));
                }
            }
        }
        obj.use(K.shader(p.shader, uv));
    }
    if (p.blend) obj.use(K.blend({ "*": K.BlendMode.Multiply, "+": K.BlendMode.Add, "screen": K.BlendMode.Screen, "overlay": K.BlendMode.Overlay }[p.blend]));
    if (p.anchor) obj.use(K.anchor(typeof p.anchor === "string" ? p.anchor : K.Vec2.deserialize(p.anchor)));
    if (p.outline) obj.use(K.outline(p.outline.width, K.rgb(p.outline.color!), p.outline.opacity, p.outline.join, p.outline.miterLimit, p.outline.cap));
    if (p.layer) obj.use(K.layer(p.layer));
    if (p.z) obj.use(K.z(p.z));
    if (p.mask) obj.use(K.mask({ "&": "intersect" as const, "-": "subtract" as const }[p.mask]));
}
