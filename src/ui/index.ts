import { AnchorComp, AreaComp, ColorComp, Comp, FixedComp, Game, GameObj, OpacityComp, PosComp, RectComp, TextComp, Vec2 } from "kaplay";
import { K } from "../context";
import { DEF_STYLES, DEF_TEXT_SIZE, STYLES } from "../TextStyles";

export interface UiObjComp extends Comp {
    action: () => void;
    child?: GameObj;
    child2?: GameObj;
}

export interface UiSliderComp extends UiObjComp {
    changeBy(value: number): void;
}

export const PAD = 10;

export function uiButton(tw: number, s: number, text: string, btn: string | null, action: () => void) {
    return [
        K.pos(),
        K.sprite("button", { width: tw, height: tw / 5 }),
        K.color(K.CYAN),
        <UiObjComp>{
            action,
            add(this: GameObj<AreaComp | UiObjComp>) {
                this.onClick(() => this.action());
                if (btn) this.onButtonPress(btn, () => this.action());
            },
            draw(this: GameObj<TextComp | UiObjComp>) {
                const fText = K.formatText({
                    text: K.sub(btn ? `$mbutton(${btn})${text}` : text),
                    anchor: "center",
                    align: "center",
                    width: this.width - 2 * PAD * s,
                    styles: STYLES,
                    size: DEF_TEXT_SIZE * s,
                    transform: DEF_STYLES,
                });
                this.height = fText.height + PAD * s;
                K.drawFormattedText(fText);
            },
            update(this: GameObj<RectComp | AreaComp | ColorComp | UiObjComp>) {
                this.color = this.isHovering() ? K.YELLOW : this.is("focused") ? K.WHITE : K.CYAN;
            }
        },
        K.anchor("center"),
        K.area(),
        "focusable",
    ]
}

export function uiPog(tw: number, s: number, text: string, sprite: string, getValue: () => boolean, action: () => void) {
    return [
        K.pos(),
        K.sprite("button", { width: tw }),
        K.opacity(0),
        K.color(K.YELLOW),
        <UiObjComp>{
            // this is not used lol
            id: "uiObj",
            action,
            add(this: GameObj<AreaComp | RectComp | UiObjComp>) {
                this.onClick(() => this.action());
                this.child = this.add([
                    K.pos(PAD - this.width / 2, 0),
                    K.sprite(sprite),
                    K.anchor("left"),
                    K.color(K.CYAN),
                ]);
            },
            draw(this: GameObj<RectComp | UiObjComp>) {
                const fText = K.formatText({
                    text: K.sub(text),
                    anchor: "left",
                    align: "left",
                    width: this.width - 2 * PAD * s,
                    styles: STYLES,
                    size: DEF_TEXT_SIZE * s,
                    transform: DEF_STYLES,
                    pos: K.vec2(PAD * 2 - this.width / 2 + this.child!.width, 0)
                });
                this.height = Math.max(fText.height, this.child!.height) + PAD * s;
                K.drawFormattedText(fText);
            },
            update(this: GameObj<RectComp | AreaComp | ColorComp | UiObjComp | OpacityComp>) {
                this.opacity = +(this.is("focused") || this.isHovering());
                this.child!.frame = getValue() ? 1 : 0;
            }
        },
        K.anchor("center"),
        K.area(),
        "focusable",
    ]
}

export function uiSlider(tw: number, s: number, text: string, start: number, stop: number, step: number | undefined, getValue: () => number, setValue: (x: number) => void) {
    return [
        K.pos(),
        K.sprite("button", { width: tw, height: tw / 5 }),
        K.opacity(0),
        K.color(K.YELLOW),
        <UiObjComp>{
            // this is not used lol
            id: "uiObj",
            add(this: GameObj<AreaComp | RectComp | UiObjComp | PosComp | FixedComp>) {
                this.child = this.add([
                    K.pos(this.width / 2 - PAD, 0),
                    K.sprite("slider_track", { width: this.width / 2 - PAD, height: 2 }),
                    K.anchor("right"),
                    K.color(K.CYAN),
                ]);
                var c = this.child2 = this.add([
                    K.pos(this.width / 2 - PAD, 0),
                    K.sprite("slider_thumb"),
                    K.anchor("center"),
                    K.color(K.CYAN),
                    K.area({ scale: 2 }),
                ]);
                var draggin = false, moving = false;
                this.onClick(() => c.isHovering() && (draggin = moving = true));
                this.onMouseRelease(() => draggin = moving = false);
                this.onHoverEnd(() => moving = false);
                this.onHover(() => draggin && (moving = true));
                this.onMouseMove(pos => {
                    if (!draggin || !moving) return;
                    const localPos = this.fromScreen(pos).x;
                    var value = K.mapc(localPos, this.child!.width - c.width / 2, c.width / 2, start, stop);
                    if (step !== undefined) value = start + step * Math.round((value - start) / step);
                    setValue(value);
                })
            },
            draw(this: GameObj<RectComp | UiObjComp>) {
                const fText = K.formatText({
                    text: K.sub(text),
                    anchor: "left",
                    align: "left",
                    width: this.width / 2 - 2 * PAD * s,
                    styles: STYLES,
                    size: DEF_TEXT_SIZE * s,
                    transform: DEF_STYLES,
                    pos: K.vec2(PAD - this.width / 2, 0)
                });
                this.height = Math.max(fText.height, this.child!.height) + 2 * PAD * s;
                K.drawFormattedText(fText);
            },
            update(this: GameObj<RectComp | AreaComp | ColorComp | UiObjComp | OpacityComp>) {
                this.opacity = +(this.is("focused") || this.isHovering());
                this.child2!.pos.x = K.mapc(getValue(), start, stop, this.child!.width - this.child2!.width / 2, this.child2!.width / 2)
            }
        },
        K.anchor("center"),
        K.area(),
        "focusable",
    ]
}

export function layoutAnchor(posGet: () => Vec2): Comp {
    return {
        require: ["pos"],
        update(this: GameObj<PosComp | AnchorComp | RectComp>) {
            this.pos = posGet().sub(K.anchorToVec2(this.anchor ?? K.Vec2.ZERO).scale((this.width ?? 0) / 2, (this.height ?? 0) / 2));
        }
    }
}

export function top() {
    return K.vec2(K.width() / 2, 0);
}

export function below(obj: GameObj<PosComp>, pad: number): Comp {
    return {
        require: ["pos"],
        update(this: GameObj<PosComp | AnchorComp | RectComp>) {
            const otherBottom = (K.anchorToVec2((obj as any).anchor ?? K.Vec2.ZERO).y + 1) * ((obj as any).height ?? 0) / 2;
            const myAnchor = (K.anchorToVec2(this.anchor ?? K.Vec2.ZERO).y + 1) * (this.height ?? 0) / 2;
            this.pos = obj.pos.add(0, otherBottom + myAnchor + pad);
        }
    }
}

export function tooltip(tip: string) {
    return {
        id: "tooltip",
        require: ["pos", "area"],
        add(this: GameObj<PosComp | AnchorComp | RectComp | AreaComp>) {
            const self = this;
            self.add([
                K.layer(K._k.game.layers!.at(-1)!),
                {
                    draw() {
                        if (!self.isHovering()) return;
                        const text = K.sub(`[i]${tip}[/i]`);
                        if (!text.trim()) return;
                        const myAnchor = (K.anchorToVec2(self.anchor ?? K.Vec2.ZERO).y + 1) * (self.height ?? 0) / 2;
                        const anchorPt = K.vec2(0, myAnchor);
                        const fText = K.formatText({
                            text,
                            anchor: "top",
                            align: "left",
                            width: self.width - 2 * PAD,
                            styles: STYLES,
                            color: K.BLACK,
                            size: DEF_TEXT_SIZE,
                            transform: DEF_STYLES,
                            pos: anchorPt.add(PAD / 2, PAD / 2),
                        });
                        K.drawRect({
                            pos: anchorPt,
                            anchor: "top",
                            width: fText.width + PAD,
                            radius: 2,
                            height: fText.height + PAD,
                            color: K.CYAN,
                        });
                        K.drawFormattedText(fText);
                    }
                }
            ])
        }
    }
}
