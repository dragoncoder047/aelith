import { AreaComp, Comp, GameObj, LayerComp, PosComp, Rect, SpriteComp, Vec2 } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { PAreaComp } from "../plugins/kaplay-aabb";

interface Pseudo3DComp extends Comp {
    p3DDrawTiled: boolean;
    p3DDepthSteps: number;
    p3DDarkenFactor: number;
    p3DOpacityFactor: number;
}

const DEPTH = 0.1;
const COLOR_FACTOR = 7;
const OPACITY_FACTOR = 8;
const IDENTITY_MATRIX = new K.Mat23();

const SHRINK_AMT = 0.1;

export function pseudo3D(tiled = true, steps = TILE_SIZE): Pseudo3DComp {
    return {
        id: "pseudo3D",
        require: ["sprite", "pos", "area"],
        p3DDrawTiled: tiled,
        p3DDepthSteps: steps,
        p3DDarkenFactor: COLOR_FACTOR,
        p3DOpacityFactor: OPACITY_FACTOR
    }
}

export interface P3DHelperComp extends Comp {
    p3DObjectList: GameObj<SpriteComp | PosComp | Pseudo3DComp | PAreaComp>[];
}

var pseudo3DEnabled = true;
export function enablePseudo3D(isEnabled: boolean) {
    pseudo3DEnabled = isEnabled;
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
            // ensure sort does its job the next time
            K.shuffle(this.p3DObjectList);
            // pre-sort a few times to make sure everything ends up where it needs to be initially
            for (var i = 0; i < this.p3DObjectList.length; i++) {
                for (var obj of this.p3DObjectList.slice()) {
                    const bbox = obj.aabb();
                    sortBySide(this.p3DObjectList, K.vec2(bbox.pos.x - SHRINK_AMT, bbox.pos.y - SHRINK_AMT));
                    sortBySide(this.p3DObjectList, K.vec2(bbox.pos.x + bbox.width + SHRINK_AMT, bbox.pos.y + bbox.height + SHRINK_AMT));
                    sortBySide(this.p3DObjectList, K.vec2(bbox.pos.x - SHRINK_AMT, bbox.pos.y + bbox.height + SHRINK_AMT));
                    sortBySide(this.p3DObjectList, K.vec2(bbox.pos.x + bbox.width + SHRINK_AMT, bbox.pos.y - SHRINK_AMT));
                }
            }
        },
        draw(this: GameObj<P3DHelperComp | PosComp>) {
            if (!pseudo3DEnabled) return;
            // step one: sort the objects so that faces never
            // lie on top of each other (face culling stuff)
            const cam = K.getCamPos();
            sortBySide(this.p3DObjectList, cam);
            // step two: draw all
            K.pushTransform();
            K.pushMatrix(IDENTITY_MATRIX);
            for (var i = 0; i < this.p3DObjectList.length; i++)
                handleDrawObject(this.p3DObjectList[i]!);
            K.popTransform();
        }
    }
}

function sortBySide(arr: GameObj<SpriteComp | PosComp | Pseudo3DComp | PAreaComp>[], cam: Vec2) {
    const getWorldAreaBoundingBox = memo1(o => o.aabb());
    const compare = memo2((a: GameObj<PAreaComp>, b: GameObj<PAreaComp>) => compareFn(a, b, cam, getWorldAreaBoundingBox));
    K.insertionSort(arr, compare);
}

function compareFn(obj1: GameObj<PAreaComp>, obj2: GameObj<PAreaComp>, cam: Vec2, memoBBox: (obj: GameObj<PAreaComp>) => Rect): boolean {
    // do all math by hand to avoid allocating vectors
    const obj1BoundingBox = memoBBox(obj1);
    const obj2BoundingBox = memoBBox(obj2);

    const obj1Left = obj1BoundingBox.pos.x + SHRINK_AMT;
    const obj1Right = obj1Left + obj1BoundingBox.width - SHRINK_AMT - SHRINK_AMT;
    const obj2Left = obj2BoundingBox.pos.x + SHRINK_AMT;
    const obj2Right = obj2Left + obj2BoundingBox.width - SHRINK_AMT - SHRINK_AMT;
    const obj1Top = obj1BoundingBox.pos.y + SHRINK_AMT;
    const obj1Bottom = obj1Top + obj1BoundingBox.height - SHRINK_AMT - SHRINK_AMT;
    const obj2Top = obj2BoundingBox.pos.y + SHRINK_AMT;
    const obj2Bottom = obj2Top + obj2BoundingBox.height - SHRINK_AMT - SHRINK_AMT;

    const maxX = Math.min(obj1Right, obj2Right);
    const minX = Math.max(obj1Left, obj2Left);
    const x = (maxX + minX) / 2;

    const maxY = Math.min(obj1Bottom, obj2Bottom);
    const minY = Math.max(obj1Top, obj2Top);
    const y = (maxY + minY) / 2;

    var obj1spX = K.clamp(x, obj1Left, obj1Right);
    var obj1spY = K.clamp(y, obj1Top, obj1Bottom);
    var obj2spX = K.clamp(x, obj2Left, obj2Right);
    var obj2spY = K.clamp(y, obj2Top, obj2Bottom);

    const bits1 = lineBits(obj1BoundingBox, cam);
    const bits2 = lineBits(obj2BoundingBox, cam);
    const int = bits1 & bits2;

    const hOvl = obj1spX === obj2spX;
    const vOvl = obj1spY === obj2spY;
    const tabval = OBJ2_SECOND_TAB[int]!;
    if (tabval & H_FIRST_BIT) {
        if (hOvl) {
            obj1spY = (obj1Top + obj1Bottom) / 2;
            obj2spY = (obj2Top + obj2Bottom) / 2;
        } else if (vOvl) {
            obj1spX = (obj1Left + obj1Right) / 2;
            obj2spX = (obj2Left + obj2Right) / 2;
        }
    } else {
        if (vOvl) {
            obj1spX = (obj1Left + obj1Right) / 2;
            obj2spX = (obj2Left + obj2Right) / 2;
        } else if (hOvl) {
            obj1spY = (obj1Top + obj1Bottom) / 2;
            obj2spY = (obj2Top + obj2Bottom) / 2;
        }
    }

    const dx = obj2spX - obj1spX;
    const dy = obj2spY - obj1spY;

    const tabBit = axisBit(dx, dy);

    return !!(tabBit & tabval);
}


const TOPLEFT_INDEX_BIT = 0b0001;
const TOPRIGHT_INDEX_BIT = 0b0010;
const BOTLEFT_INDEX_BIT = 0b0100;
const BOTRIGHT_INDEX_BIT = 0b1000;

const H_FIRST_BIT = 0b10000;
const UP_BIT = 0b01000;
const RIGHT_BIT = 0b00100;
const DOWN_BIT = 0b00010;
const LEFT_BIT = 0b00001;

// values are 1 if obj2 should be drawn second (on top) or don't care, and 0 if obj2 should be drawn first (on bottom)
// (obj2 is the yellow one here; it always draws on top)
// columns are line from object1 point to object 2 point (green->yellow)
// angle: up, right, down, left
// h is swap order hack
//0bhurdl
const OBJ2_SECOND_TAB = [
    // 0 = no intersection anywhere
    0b01111,
    // 1 = top left only
    0b00110,
    // 2 = top right only
    0b00011,
    // 3 = top right & top left
    0b00010,
    // 4 = bottom left
    0b01100,
    // 5 = top left & bottom left
    0b11110,
    // 6 = top right & bottom left (impossible)
    0,
    // 7 = top left, top right, & bottom left (impossible)
    0,
    // 8 = bottom right
    0b01001,
    // 9 = bottom right & top left (impossible)
    0,
    // 10 = top right & bottom right
    0b10001,
    // 11 = top left, top right, & bottom right (impossible)
    0,
    // 12 = bottom left & bottom right
    0b01000,
    // 13 = impossible
    0,
    // 14 = impossible
    0,
    // 15 = both straddle center
    0b01111,
]

function lineBits(bbox: Rect, cam: Vec2) {
    const left = bbox.pos.x;
    const right = left + bbox.width;
    const top = bbox.pos.y;
    const bottom = top + bbox.height;
    var res = 0;
    if (top < cam.y) {
        if (right > cam.x) res |= TOPRIGHT_INDEX_BIT;
        if (left < cam.x) res |= TOPLEFT_INDEX_BIT;
    }
    if (bottom > cam.y) {
        if (right > cam.x) res |= BOTRIGHT_INDEX_BIT;
        if (left < cam.x) res |= BOTLEFT_INDEX_BIT;
    }
    return res;
}

// like Vec2.toAxis but no vector allocated required nor any call to toAngle() and then math on that
function axisBit(dx: number, dy: number) {
    return Math.abs(dx) > Math.abs(dy)
        ? dx < 0 ? LEFT_BIT : RIGHT_BIT
        : dy < 0 ? UP_BIT : DOWN_BIT;
}

function handleDrawObject(obj: GameObj<Pseudo3DComp | SpriteComp | PosComp>) {
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
            color: K.WHITE.darken(255 * t * obj.p3DDarkenFactor),
            opacity: 1 - (t * obj.p3DOpacityFactor),
            tiled: obj.p3DDrawTiled
        });
        K.pushScale(K.vec2(1).invScale(scale));
        K.pushTranslate(pos.scale(-1));
    }
}

function memo2<T extends GameObj, U extends GameObj, V>(f: (x: T, y: U) => V): (x: T, y: U) => V {
    const cache: Record<string, V> = {};
    return (x, y) => {
        const key = `${x.id.toString(16)},${y.id.toString(16)}`;
        return cache[key] ?? (cache[key] = f(x, y));
    };
}

function memo1<T extends GameObj, U>(f: (x: T) => U): (x: T) => U {
    const cache: Record<string, U> = {};
    return (x) => {
        const key = x.id.toString(16);
        return cache[key] ?? (cache[key] = f(x));
    };
}
