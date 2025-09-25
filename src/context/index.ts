import kaplay, { AnchorComp, AreaComp, FixedComp, GameObj, KAPLAYCtx } from "kaplay";
import kaplayLighting from "kaplay-lighting";
import { SCALE } from "../static/constants";
import { kaplayAABB } from "./plugins/kaplay-aabb";
import { kaplayDynamicStrings } from "./plugins/kaplay-dynamic-text";
import { kaplayRumble } from "./plugins/kaplay-gamepad-rumble";
import { kaplayExtraDistance } from "./plugins/kaplay-extradistance";
import { kaplayXterm256 } from "./plugins/kaplay-xterm256";
import { kaplayZzFX } from "./plugins/kaplay-zzfx";
import { kaplayZzFXM } from "./plugins/kaplay-zzfxm";

export const K = kaplay({
    debug: true,
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    touchToMouse: false,
    inspectOnlyActive: true,
    tagComponentIds: false,
    buttons: {} as any,
    font: "Unscii",
    plugins: [
        kaplayXterm256,
        kaplayZzFX,
        kaplayZzFXM,
        kaplayExtraDistance,
        kaplayDynamicStrings,
        kaplayRumble,
        kaplayAABB,
        kaplayLighting,
        function dummy(k: KAPLAYCtx) {
            const old = k.area;
            return {
                area(...args: Parameters<typeof old>) {
                    const comp = old(...args);
                    comp.drawInspect = function (this: GameObj<AreaComp | AnchorComp | FixedComp>) {
                        const a = this.localArea();

                        k.pushTransform();
                        k.pushTranslate(k.vec2(this.area.offset.x, this.area.offset.y));
                        const isFixed = (obj: any): boolean => obj.fixed || (obj.parent ? isFixed(obj.parent) : false);

                        const opts = {
                            outline: {
                                width: 4 / k._k.gfx.viewport.scale,
                                color: this.isHovering() ? k.GREEN : k.BLUE,
                            },
                            anchor: this.anchor,
                            fill: false,
                            fixed: isFixed(this),
                        };

                        if (a instanceof k.Rect) {
                            k.drawRect({
                                ...opts,
                                pos: a.pos,
                                width: a.width * this.area.scale.x,
                                height: a.height * this.area.scale.y,
                            });
                        }
                        else if (a instanceof k.Polygon) {
                            k.drawPolygon({
                                ...opts,
                                pts: a.pts,
                                scale: this.area.scale,
                            });
                        }
                        else if (a instanceof k.Circle) {
                            k.drawCircle({
                                ...opts,
                                pos: a.center,
                                radius: a.radius,
                            });
                        }

                        k.popTransform();
                    }
                    return comp;
                }
            }
        }
    ],
});

K.onLoadError((which, e) => {
    const newError = new Error(`Error while loading ${which}: ${e.error?.message ?? e.error}`);
    if (e.error?.stack) newError.stack = e.error.stack;
    throw newError;
});
