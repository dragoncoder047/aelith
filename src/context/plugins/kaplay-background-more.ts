import { Color, GameObj, KAPLAYCtx, KEventController } from "kaplay";
import { KAPLAYLightingPlugin } from "kaplay-lighting";
import { XY } from "../../DataPackFormat";
import { JSONObject } from "../../JSON";

// json object means nothing here it's just for my data pack
export interface BackgroundLayer extends JSONObject {
    depth?: number;
    customData?: any;
    type: "color" | "sprite" | "custom";
    value?: string | [string, number];
    pos?: XY;

}

export interface KAPLAYAdvancedBackgroundPlugin {
    setBackground(b: string | Color | BackgroundLayer[]): void;
    getDefaultDepth(): number;
    setDefaultDepth(depth: number): void;
    setBackgroundRenderingAddons(add: (obj: GameObj, customData?: any) => void): void;
}

export function kaplayBackground(K: KAPLAYCtx & KAPLAYLightingPlugin & KAPLAYAdvancedBackgroundPlugin): KAPLAYAdvancedBackgroundPlugin {
    var defaultDepth = 0.1;
    var backgroundAddons = (x: GameObj, data: any) => { };
    return {
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
            if (typeof b === "string") {
                K.setBackground([{ type: "color", value: b }]);
            }
            else if (b instanceof K.Color) {
                K.setBackground([{ type: "color", value: b.toHex() }]);
            }
            else if (Array.isArray(b)) {
                K.get("__background").forEach(o => o.destroy());
                const objs = [];
                for (var layer of b) {
                    const d = layer.depth ?? defaultDepth;
                    const p = layer.pos ? K.Vec2.deserialize(layer.pos) : K.Vec2.ZERO;
                    const obj = K.add([
                        K.pos(),
                        K.area(),
                        "__background",
                        {
                            depth: d,
                            realPos: p,
                            tileX: 0,
                            tileY: 0,
                            update(this: GameObj) {
                                const c = K.getCamPos().sub(K.width() / 2, K.height() / 2);
                                var xx = 0, yy = 0;
                                const tx = this.tileX, ty = this.tileY;
                                if (tx > 0 && ty > 0) {
                                    const l = K.lerp(this.realPos, c, this.depth);
                                    // Wrap everything so it's on screen
                                    while (l.x < c.x) l.x += tx, xx += tx;
                                    while (l.x > tx + c.x) l.x -= tx, xx -= tx;
                                    l.x -= tx;
                                    while (l.y < c.y) l.y += ty, yy += ty;
                                    while (l.y > ty + c.y) l.y -= ty, yy -= ty;
                                    l.y -= ty;
                                    this.pos = l;
                                } else {
                                    this.pos = c;
                                }
                                const s = K.getCamScale();
                                this.width = tx * s.x * Math.ceil(K.width() / tx / s.x);
                                this.height = ty * s.y * Math.ceil(K.width() / ty / s.y);
                                if (this.has("shader")) {
                                    Object.assign(this.uniform, {
                                        u_quadSz: K.vec2(this.width, this.height),
                                        u_offset: K.vec2(xx, yy),
                                    });
                                }
                            }
                        }
                    ]);
                    backgroundAddons(obj, layer.customData);
                    // Unshift so objects in back will be listed first
                    // since layer correction reverses the order
                    objs.unshift(obj);
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
                    c.splice(c.indexOf(obj), 1);
                    c.unshift(obj);
                });
            }
            else throw new Error("idk what to do with " + b + " for background");
        },
    }
}
