import { AreaComp, Comp, GameObj, LayerComp, PosComp, Rect, SpriteComp, Tag } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";

interface Pseudo3DComp extends Comp {
    p3DReflectSide: boolean;
    p3DDrawTiled: boolean;
    p3DDepthSteps: number;
}

const DEPTH = 0.1;
const COLOR_FACTOR = 5;
const IDENTITY_MATRIX = new K.Mat23();

export function pseudo3D(flip: boolean, tiled = true, steps = TILE_SIZE): Pseudo3DComp {
    return {
        id: "pseudo3D",
        require: ["sprite", "pos", "area"],
        p3DReflectSide: flip,
        p3DDrawTiled: tiled,
        p3DDepthSteps: steps,
    }
}

export interface P3DHelperComp extends Comp {
    p3DObjectList: GameObj<SpriteComp | PosComp | Pseudo3DComp | AreaComp>[];
}

export function p3DHelper(layer?: string): P3DHelperComp {
    layer ??= K._k.game.layers![0];
    return {
        id: "p3dHelper",
        require: ["pos"],
        p3DObjectList: [],
        add(this: GameObj<P3DHelperComp | LayerComp>) {
            if (!this.has("layer")) this.use(K.layer(layer!));
            else this.layer = layer!;
            this.p3DObjectList = this.get("pseudo3D", { liveUpdate: true, only: "comps" });
        },
        draw() {
            // step one: sort the objects so that faces never
            // lie on top of each other (face culling stuff)
            // const v = K.Vec2;
            // const axisNeg = v._fromPool();
            // const ae = v._fromPool();
            // const be = v._fromPool();
            // const cam = K.getCamPos();
            // const camRel = v._fromPool();
            // K.insertionSort(this.p3DObjectList, (a, b) => {
            //     const aa = a.worldArea();
            //     const ba = b.worldArea();
            //     const axis = v.sub(ba.gjkCenter, aa.gjkCenter, camRel).toAxis();
            //     v.scale(axis, -1, axisNeg);
            //     const ad = aa.support(axis);
            //     const bd = ba.support(axisNeg);
            //     v.add(aa.gjkCenter, ad, ae);
            //     v.add(ba.gjkCenter, bd, be);
            //     v.scale(be, 1/2, be);
            //     v.addScaled(be, ae, 1/2, be);
            //     v.sub(be, cam, camRel);
            //     // TODO: determine based on relative position which comes first
            // });
            // v._returnPool(axisNeg);
            // v._returnPool(ae);
            // v._returnPool(be);
            // v._returnPool(camRel);
            // step two: draw all
            K.pushTransform();
            K.pushMatrix(IDENTITY_MATRIX);
            for (var i = 0; i < this.p3DObjectList.length; i++) handleDrawObject(this.p3DObjectList[i]!);
            K.popTransform();
        }
    }
}

function handleDrawObject(obj: GameObj<Pseudo3DComp | SpriteComp | PosComp>) {
    if (obj.p3DReflectSide && Math.random() === 2) {
        // chop polygons
        // top
        // bottom
        // left
        // right
    } else {
        // just draw a bunch of times in relation to the camera
        for (var i = obj.p3DDepthSteps - 1; i >= 0; i--) {
            const t = DEPTH * i / obj.p3DDepthSteps;
            const pos = K.lerp(obj.worldPos()!, K.getCamPos(), t);
            const scale = K.vec2(1 - t);
            K.pushTranslate(pos);
            K.pushScale(scale);
            K.drawSprite({
                ...obj,
                pos: K.vec2(0),
                color: K.WHITE.darken(255 * t * COLOR_FACTOR),
                tiled: obj.p3DDrawTiled
            });
            K.pushScale(K.vec2(1).invScale(scale));
            K.pushTranslate(pos.scale(-1));
        }
    }
}
