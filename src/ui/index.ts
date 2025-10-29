import { AnchorComp, AreaComp, ColorComp, Comp, FixedComp, GameObj, OpacityComp, PosComp, RectComp, TextComp, Vec2 } from "kaplay";
import { K } from "../context";
import { DEF_STYLES, DEF_TEXT_SIZE, STYLES } from "../TextStyles";

export interface UiObjComp extends Comp {
    action(): void;
    rawText(): string;
    child?: GameObj;
    child2?: GameObj;
}

export interface UiSliderComp extends UiObjComp {
    changeBy(value: number): void;
    lo: number,
    hi: number
    posToValue(x: number): number;
    valueToPos(value: number): number;
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
                    text: K.sub(this.rawText()),
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
                this.color = this.is("focused") ? K.GREEN : this.isHovering() ? K.YELLOW : K.CYAN;
            },
            rawText() {
                return btn ? `$mbutton(${btn})${text}` : text;
            },
            inspect() {
                return `t: ${this.rawText()}`;
            },
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
                    text: K.sub(this.rawText()),
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
                this.color = this.is("focused") ? K.GREEN : K.YELLOW;
                this.child!.frame = getValue() ? 1 : 0;
            },
            rawText() {
                return text;
            },
            inspect() {
                return `t: ${this.rawText()}`;
            },
        },
        K.anchor("center"),
        K.area(),
        "focusable",
    ]
}

export function uiSlider(tw: number, s: number, text: string, start: number, stop: number, step: number | undefined, getValue: () => number, setValue: (x: number) => void, formatValue: (x: number) => string) {
    const process = (value: number, round: (x: number) => number) => {
        if (step !== undefined) value = start + step * round((value - start) / step);
        value = K.clamp(value, start, stop);
        return value;
    }
    return [
        K.pos(),
        K.sprite("button", { width: tw, height: tw / 5 }),
        K.opacity(0),
        K.color(K.YELLOW),
        <UiSliderComp>{
            id: "uiSlider",
            lo: start, hi: stop,
            action() {
            },
            changeBy(by) {
                setValue(process(getValue() + by, by > 0 ? Math.ceil : Math.floor));
            },
            posToValue(x) {
                const c1 = this.child!, c2 = this.child2!;
                const side = c2.width / 2;
                const minX = c1.pos.x - c1.width + side;
                const maxX = c1.pos.x - side;
                return process(K.mapc(x, minX, maxX, start, stop), Math.round);
            },
            valueToPos(value) {
                const c1 = this.child!, c2 = this.child2!;
                const side = c2.width / 2;
                const minX = c1.pos.x - c1.width + side;
                const maxX = c1.pos.x - side;
                return K.mapc(value, start, stop, minX, maxX);
            },
            add(this: GameObj<AreaComp | RectComp | UiSliderComp | PosComp | FixedComp>) {
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
                    setValue(this.posToValue(this.fromScreen(pos).x));
                })
            },
            draw(this: GameObj<RectComp | UiObjComp>) {
                const fText = K.formatText({
                    text: K.sub(this.rawText()),
                    anchor: "left",
                    align: "left",
                    width: this.width / 2 - 2 * PAD * s,
                    styles: STYLES,
                    size: DEF_TEXT_SIZE * s,
                    transform: DEF_STYLES,
                    pos: K.vec2(PAD - this.width / 2, 0)
                });
                const fText2 = K.formatText({
                    text: formatValue(getValue()),
                    anchor: "center",
                    styles: STYLES,
                    size: DEF_TEXT_SIZE * s,
                    transform: DEF_STYLES,
                    pos: K.Vec2.ZERO
                });
                this.child!.width = this.width / 2 - PAD - fText2.width;
                this.height = Math.max(fText.height, this.child!.height) + 2 * PAD * s;
                K.drawFormattedText(fText);
                K.drawFormattedText(fText2);
            },
            update(this: GameObj<RectComp | AreaComp | ColorComp | UiSliderComp | OpacityComp>) {
                this.opacity = +(this.is("focused") || this.isHovering());
                this.color = this.is("focused") ? K.GREEN : K.YELLOW;
                this.child2!.pos.x = this.valueToPos(getValue());
            },
            rawText() {
                return text;
            },
            inspect() {
                return `t: ${this.rawText()}`;
            },
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
    if (!tip) return {};
    return {
        id: "tooltip",
        require: ["pos", "area"],
        add(this: GameObj<PosComp | AnchorComp | RectComp | AreaComp>) {
            const self = this;
            self.add([
                K.layer(K._k.game.layers!.at(-1)!),
                {
                    draw() {
                        if (!self.isHovering() && !self.is("focused")) return;
                        const text = K.sub(this.rawText());
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
                    },
                    rawText() {
                        return `[i]${tip}[/i]`;
                    },
                    inspect() {
                        return `t: ${this.rawText()}`;
                    },
                }
            ])
        }
    }
}
