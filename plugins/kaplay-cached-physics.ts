import type {
    Anchor, AnchorComp, AreaComp, AreaCompOpt,
    Comp, GameObj, InternalGameObjRaw,
    KAPLAYCtx, Mat23, Rect, Shape, Vec2
} from "kaplay";

const DEF_ANCHOR = "topleft";
enum DirtyFlags {
    LOCAL_TRANSFORM = 1,
    WORLD_TRANSFORM = 2,
    LOCAL_AREA = 4,
    WORLD_AREA = 8,
    AREA = 12,
    EVERYTHING = 15,
}

const PROPS_AFFECTING_TRANSFORM: Record<string, DirtyFlags> = {
    "pos": DirtyFlags.EVERYTHING,
    "angle": DirtyFlags.EVERYTHING,
    "width": DirtyFlags.AREA,
    "height": DirtyFlags.AREA,
    "anchor": DirtyFlags.AREA,
    "scale": DirtyFlags.AREA,
};

// cSpell: ignore proxyify
function proxyify<T>(obj: T, onChange: () => void): T {
    if (typeof obj !== "object" && typeof obj !== "function" && obj !== null)
        return obj;
    return new Proxy(obj as any, {
        set(target, prop, value) {
            target[prop] = value;
            onChange();
            return true;
        },
    });
}

function calculateLocalTransform(obj: GameObj, tr: Mat23): Mat23 {
    tr.setIdentity();
    if (obj.pos) tr.translateSelfV(obj.pos);
    if (obj.angle) tr.rotateSelf(obj.angle);
    if (obj.scale) tr.scaleSelfV(obj.scale);
    return tr;
}

function calculateWorldTransform(obj: GameObj, tr: Mat23): Mat23 {
    if (obj.parent) tr.setMat23(obj.parent.worldTransform);
    else tr.setIdentity();
    tr.mulSelf(obj.localTransform);
    return tr;
}

type PProto = InternalGameObjRaw & {
    _dirtyFlags: number;
    _worldTransform: Mat23;
    worldTransform: Mat23;
    _localTransform: Mat23;
    localTransform: Mat23;
    _parentTransform: Mat23 | undefined;
}

export interface PAreaComp extends AreaComp {
    _localArea: Shape | undefined;
    _worldArea: Shape | undefined;
    _aabb: Rect | undefined;
    aabb(): Rect;
};

export interface KAPLAYPatchedAreaPlugin {
    area(opt: AreaCompOpt): PAreaComp;
}

export function kaplayCachePhysics(k: KAPLAYCtx): KAPLAYPatchedAreaPlugin {
    const Vec2 = k.Vec2;
    const Rect = k.Rect;
    const oldAreaComp = k.area;
    // const obj = k.add([]);
    // const GameObjRawPrototype: PProto = Object.getPrototypeOf(obj);
    // obj.destroy();
    // const oldUse = GameObjRawPrototype.use;
    // Object.defineProperties(GameObjRawPrototype, {
    //     _dirtyFlags: {
    //         value: DirtyFlags.EVERYTHING,
    //         writable: true,
    //     },
    //     use: {
    //         value(this: PProto, comp: Comp) {
    //             // do normal things
    //             oldUse.call(this, comp);
    //             for (const key of Object.keys(comp)) {
    //                 if (key in PROPS_AFFECTING_TRANSFORM) {
    //                     Object.defineProperty(this, key, {
    //                         get() {
    //                             return comp[key as keyof typeof comp];
    //                         },
    //                         set(this: PProto, x: any) {
    //                             const onchange = () => this._dirtyFlags |= PROPS_AFFECTING_TRANSFORM[key]!;
    //                             onchange();
    //                             comp[key as keyof typeof comp] = proxyify(x, onchange);
    //                         }
    //                     });
    //                     // trigger update and proxyify
    //                     (this as any)[key] = (this as any)[key];
    //                 }
    //             }
    //         }
    //     },
    //     transform: {
    //         get() {
    //             return this._worldTransform;
    //         },
    //         set(_) {
    //             // do nothing with it
    //             // this should be readonly but I didn't want to bother basically reimplementing
    //             // everything just to eliminate all the places where the object's transform is set
    //         }
    //     },
    //     localTransform: {
    //         get() {
    //             if (this._dirtyFlags & DirtyFlags.LOCAL_TRANSFORM) {
    //                 this._localTransform = calculateLocalTransform(this, this._localTransform);
    //                 this._dirtyFlags &= ~DirtyFlags.LOCAL_TRANSFORM;
    //                 this._dirtyFlags |= DirtyFlags.WORLD_TRANSFORM | DirtyFlags.AREA;
    //             }
    //             return this._localTransform;
    //         }
    //     },
    //     _localTransform: {
    //         value: new k.Mat23(),
    //         writable: true,
    //     },
    //     _parentTransform: {
    //         value: undefined,
    //         writable: true,
    //     },
    //     worldTransform: {
    //         get() {
    //             if (this._dirtyFlags & DirtyFlags.WORLD_TRANSFORM || this._parentTransform !== this.parent?.worldTransform) {
    //                 this._worldTransform = calculateWorldTransform(this, this._worldTransform);
    //                 this._parentTransform = this.parent?.worldTransform!;
    //                 this._dirtyFlags &= ~DirtyFlags.WORLD_TRANSFORM;
    //                 this._dirtyFlags |= DirtyFlags.AREA;
    //             }
    //             return this._worldTransform;
    //         }
    //     },
    //     _worldTransform: {
    //         value: new k.Mat23(),
    //         writable: true,
    //     },
    // });
    return {
        area(opt) {
            const comp = oldAreaComp(opt);
            // const oldAdd = comp.add!;
            // const patchedArea = (self: PProto, area: AreaComp["area"]): AreaComp["area"] => {
            //     return new Proxy(area, {
            //         set(target, key, val) {
            //             const onchange = () => self._dirtyFlags |= DirtyFlags.AREA;
            //             if (["scale", "shape", "offset"].includes(key as any)) {
            //                 val = proxyify(val, onchange);
            //             }
            //             target[key as keyof typeof target] = val;
            //             onchange();
            //             return true;
            //         },
            //     })
            // };
            const newComp: PAreaComp = {
                ...comp,
                // add(this: PProto & GameObj<PAreaComp>) {
                //     oldAdd.call(this);
                //     comp.area = patchedArea(this, this.area);
                // },
                _localArea: undefined,
                _worldArea: undefined,
                // get area() {
                //     return comp.area;
                // },
                // set area(a) {
                //     comp.area = patchedArea(this as any, a);
                // },
                // localArea(this: PProto & GameObj<PAreaComp | { renderArea(): Shape }>): Shape {
                //     if (this._dirtyFlags & DirtyFlags.LOCAL_AREA) {
                //         this._localArea = this.area.shape ? this.area.shape : this.renderArea();
                //         this._dirtyFlags &= ~DirtyFlags.LOCAL_AREA;
                //         this._dirtyFlags |= DirtyFlags.WORLD_AREA;
                //     }

                //     return this._localArea!;
                // },
                // worldArea(this: PProto & GameObj<PAreaComp | AnchorComp>): Shape {
                //     if (this._dirtyFlags & DirtyFlags.WORLD_AREA) {
                //         const localArea = this.localArea();

                //         // World transform
                //         const transform = this.worldTransform.clone();
                //         // Optional area offset
                //         if (this.area.offset.x !== 0 || this.area.offset.y !== 0) {
                //             transform.translateSelfV(this.area.offset);
                //         }
                //         // Optional area scale
                //         if (this.area.scale.x !== 1 || this.area.scale.y !== 1) {
                //             transform.scaleSelfV(this.area.scale);
                //         }
                //         // Optional anchor offset (Rect only??)
                //         if (localArea instanceof Rect && this.anchor !== "topleft") {
                //             const offset = anchorPt(this.anchor || DEF_ANCHOR)
                //                 .add(1, 1)
                //                 .scale(-0.5 * localArea.width, -0.5 * localArea.height);
                //             transform.translateSelfV(offset);
                //         }

                //         this._worldArea = localArea.transform(transform);
                //         this._dirtyFlags &= ~DirtyFlags.WORLD_AREA;
                //     }

                //     return this._worldArea!;
                // },
                _aabb: undefined,
                aabb(this: PProto & GameObj<PAreaComp>) {
                    // if (this._aabb === undefined || this._dirtyFlags & DirtyFlags.WORLD_AREA) {
                    this._aabb = this.worldArea().bbox();
                    // }
                    return this._aabb;
                }
            };
            return newComp;
        }
    }

    // copied from kaplay/src/gfx/anchor.ts and kaplay/src/constants/math.ts
    function anchorPt(orig: Anchor | Vec2): Vec2 {
        const TOP_LEFT = new Vec2(-1, -1);
        const TOP = new Vec2(0, -1);
        const TOP_RIGHT = new Vec2(1, -1);
        const LEFT = new Vec2(-1, 0);
        const CENTER = new Vec2(0, 0);
        const RIGHT = new Vec2(1, 0);
        const BOTTOM_LEFT = new Vec2(-1, 1);
        const BOTTOM = new Vec2(0, 1);
        const BOTTOM_RIGHT = new Vec2(1, 1);
        switch (orig) {
            case "topleft":
                return TOP_LEFT;
            case "top":
                return TOP;
            case "topright":
                return TOP_RIGHT;
            case "left":
                return LEFT;
            case "center":
                return CENTER;
            case "right":
                return RIGHT;
            case "botleft":
                return BOTTOM_LEFT;
            case "bot":
                return BOTTOM;
            case "botright":
                return BOTTOM_RIGHT;
            default:
                return orig;
        }
    }
}
