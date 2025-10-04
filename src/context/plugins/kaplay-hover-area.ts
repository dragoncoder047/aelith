import { KAPLAYCtx, GameObj, AreaComp, AnchorComp, FixedComp } from "kaplay";

export function kaplayHoverArea(k: KAPLAYCtx) {
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
