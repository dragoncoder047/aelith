import { Anchor, Color, GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { KAPLAYLightingPlugin } from "kaplay-lighting";
import { XY, JSONObject } from "../../utils/JSON";

// json object means nothing here it's just for my data pack
export interface BackgroundLayer extends JSONObject {
    depth?: number;
    customData?: any;
    type: "color" | "sprite" | "custom";
    value?: string | [string, number];
    pos?: XY;

}

export interface KAPLAYAdvancedBackgroundPlugin {
    setVanishingAnchor(anchor: Anchor | Vec2): void;
    getVanishingPoint(): Vec2;
    setBackground(b: string | Color | BackgroundLayer[]): void;
    getDefaultDepth(): number;
    setDefaultDepth(depth: number): void;
    setBackgroundRenderingAddons(add: (obj: GameObj, customData?: any) => void): void;
}

export function kaplayBackground(K: KAPLAYCtx & KAPLAYLightingPlugin & KAPLAYAdvancedBackgroundPlugin): KAPLAYAdvancedBackgroundPlugin {
    var defaultDepth = 0.1;
    var backgroundAddons = (x: GameObj, data: any) => { };
    var vanishingAnchor = K.Vec2.ZERO;
    const marginUp = (x: number) => x * Math.ceil(64 / x);
    return {
        setVanishingAnchor(anchor) {
            vanishingAnchor = K.anchorToVec2(anchor);
        },
        getVanishingPoint() {
            const s = K.getCamScale();
            return K.getCamPos().add(K.width() / 2 * vanishingAnchor.x / s.x, K.height() / 2 * vanishingAnchor.y / s.y);
        },
        setDefaultDepth(depth) {
            defaultDepth = depth;
        },
        getDefaultDepth() {
            return defaultDepth;
        },
        setBackgroundRenderingAddons(add) {
            backgroundAddons = add;
        },
        setBackground(b) {
            // TODO: do this with onDraw() now that it always draws in the background. This should not be an object that can be get()'ed and raycast()'ed
            if (typeof b === "string") {
                K.setBackground([{ type: "color", value: b }]);
            }
            else if (b instanceof K.Color) {
                K.setBackground([{ type: "color", value: b.toHex() }]);
            }
            else if (Array.isArray(b)) {
                K.get("__background").forEach(o => o.destroy());
                const objs: GameObj[] = [];
                for (var layer of b) {
                    const obj = K.add([
                        K.pos(),
                        K.area(),
                        "__background",
                        {
                            depth: layer.depth ?? defaultDepth,
                            realPos: layer.pos ? K.Vec2.deserialize(layer.pos) : K.Vec2.ZERO,
                            tileX: 0,
                            tileY: 0,
                            update(this: GameObj) {
                                const camScale = K.getCamScale();
                                const camPos = K.getCamPos().sub(K.width() / 2 / camScale.x, K.height() / 2 / camScale.y);
                                const vanishPoint = K.getVanishingPoint();
                                var xx = 0, yy = 0;
                                const tileX = this.tileX, tileY = this.tileY;
                                if (tileX > 0 && tileY > 0) {
                                    const l = K.lerp(this.realPos, vanishPoint, this.depth);
                                    // Wrap so it's always on screen
                                    while (l.x < camPos.x) l.x += tileX, xx += tileX;
                                    while (l.x > tileX + camPos.x) l.x -= tileX, xx -= tileX;
                                    l.x -= marginUp(tileX);
                                    while (l.y < camPos.y) l.y += tileY, yy += tileY;
                                    while (l.y > tileY + camPos.y) l.y -= tileY, yy -= tileY;
                                    l.y -= marginUp(tileY);
                                    this.pos = l;
                                } else {
                                    this.pos = vanishPoint;
                                    xx = vanishPoint.x;
                                    yy = vanishPoint.y;
                                }
                                this.width = K.width() / camScale.x + 2 * marginUp(tileX);
                                this.height = K.height() / camScale.y + 2 * marginUp(tileY);
                                if (this.has("shader")) {
                                    this.uniform.u_quadSz = K.vec2(this.width, this.height);
                                    this.uniform.u_offset = K.vec2(xx, yy);
                                }
                            }
                        }
                    ]);
                    backgroundAddons(obj, layer.customData);
                    objs.push(obj);
                    switch (layer.type) {
                        case "color":
                            obj.use(K.uvquad(0, 0));
                            obj.use(K.color(layer.value as string));
                            break;
                        case "sprite":
                            const s = Array.isArray(layer.value) ? layer.value[0] : layer.value!;
                            const f = Array.isArray(layer.value) ? layer.value[1] : 0;
                            obj.use(K.sprite(s, { tiled: true }));
                            obj.use({
                                add(this: GameObj) {
                                    K.getSprite(s)!.then(d => {
                                        this.tileX = d.width;
                                        this.tileY = d.height;
                                    });
                                    this.frame = f;
                                },
                            });
                            break;
                    }
                }
                const r = K.getTreeRoot(), c = r.children;
                const l0 = K._k.game.layers![0]!;
                objs.forEach(obj => {
                    obj.use(K.layer(l0));
                });
            }
            else throw new Error("idk what to do with " + b + " for background");
        },
    }
}
