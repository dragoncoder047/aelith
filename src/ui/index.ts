import { AnchorComp, AreaComp, ColorComp, Comp, FixedComp, GameObj, OpacityComp, PosComp, RectComp, TextComp, Vec2 } from "kaplay";
import { K } from "../context";
import * as GameManager from "../GameManager";
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
        K.sprite(GameManager.getUIKey("sprites", "button"), { width: tw * K.width(), height: tw / 5 * K.width() }),
        K.color(K.rgb(GameManager.getUIKey("colors", "normal"))),
        <UiObjComp>{
            action,
            add(this: GameObj<AreaComp | UiObjComp>) {
                this.onClick(() => this.action());
                if (btn) this.onButtonPress(btn, () => {
                    K.wait(0, () => { // Wait to allow other buttons to be processed if they're defined after my button
                        // Don't do the action if nav_select was pressed and another thing is focused
                        if (K.isButtonDown("nav_select") && !this.is("focused") && K.get("focused").length > 0) return;
                        this.action();
                    });
                });
            },
            draw(this: GameObj<TextComp | UiObjComp>) {
                this.width = tw * K.width();
                const fText = K.formatText({
                    text: K.sub(this.rawText()),
                    anchor: "center",
                    align: "center",
                    width: this.width - 2 * PAD * s,
                    styles: STYLES,
                    size: DEF_TEXT_SIZE * s,
                    transform: DEF_STYLES,
                    font: GameManager.getDefaultValue("font"),
                });
                this.height = fText.height + PAD * s;
                K.drawFormattedText(fText);
            },
            update(this: GameObj<RectComp | AreaComp | ColorComp | UiObjComp>) {
                this.color = K.rgb(GameManager.getUIKey("colors", this.is("focused") ? "focus" : this.isHovering() ? "hover" : "normal"));
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
        K.sprite(GameManager.getUIKey("sprites", "button"), { width: tw * K.width() }),
        K.opacity(0),
        K.color(K.rgb(GameManager.getUIKey("colors", "hover"))),
        <UiObjComp>{
            id: "uiObj",
            action,
            add(this: GameObj<AreaComp | RectComp | UiObjComp>) {
                this.onClick(() => this.action());
                this.child = this.add([
                    K.pos(PAD - this.width / 2, 0),
                    K.sprite(sprite),
                    K.anchor("left"),
                    K.color(K.rgb(GameManager.getUIKey("colors", "normal"))),
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
                    font: GameManager.getDefaultValue("font"),
                    // XXX
                    pos: K.vec2(PAD * 2 - this.width / 2 + this.child!.width, 0)
                });
                this.height = Math.max(fText.height, this.child!.height) + PAD * s;
                K.drawFormattedText(fText);
            },
            update(this: GameObj<RectComp | AreaComp | ColorComp | UiObjComp | OpacityComp>) {
                this.opacity = 0.5 * +(this.is("focused") || this.isHovering());
                this.color = K.rgb(GameManager.getUIKey("colors", this.is("focused") ? "focus" : "hover"));
                this.child!.frame = getValue() ? 1 : 0;
                this.width = tw * K.width();
            },
            rawText() {
                return text;
            },
            inspect() {
                return `pog text: ${this.rawText()}`;
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
        K.sprite(GameManager.getUIKey("sprites", "button"), { width: tw * K.width(), height: tw / 5 * K.width() }),
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
                    K.sprite(GameManager.getUIKey("sprites", "sliderTrack"), { width: this.width / 2 - PAD, height: 2 }),
                    K.anchor("right"),
                    K.color(K.rgb(GameManager.getUIKey("colors", "normal"))),
                ]);
                var c = this.child2 = this.add([
                    K.pos(this.width / 2 - PAD, 0),
                    K.sprite(GameManager.getUIKey("sprites", "sliderThumb")),
                    K.anchor("center"),
                    K.color(K.rgb(GameManager.getUIKey("colors", "normal"))),
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
                    pos: K.vec2(PAD - this.width / 2, 0),
                    font: GameManager.getDefaultValue("font"),

                });
                const fText2 = K.formatText({
                    text: formatValue(getValue()),
                    anchor: "center",
                    styles: STYLES,
                    size: DEF_TEXT_SIZE * s,
                    transform: DEF_STYLES,
                    pos: K.Vec2.ZERO,
                    font: GameManager.getDefaultValue("font"),

                });
                const newWidth = this.width / 2 - PAD - fText2.width;
                this.child!.width = Math.min(this.child!.width, newWidth);
                this.height = Math.max(fText.height, this.child!.height) + 2 * PAD * s;
                K.drawFormattedText(fText);
                K.drawFormattedText(fText2);
            },
            update(this: GameObj<RectComp | AreaComp | ColorComp | UiSliderComp | OpacityComp>) {
                this.opacity = 0.5 * +(this.is("focused") || this.isHovering());
                this.color = K.rgb(GameManager.getUIKey("colors", this.is("focused") ? "focus" : "hover"));
                this.child2!.pos.x = this.valueToPos(getValue());
                this.width = tw * K.width();
                this.height = this.width / 5;
            },
            rawText() {
                return text;
            },
            inspect() {
                return `slider text: ${this.rawText()}`;
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

export interface BelowComp extends Comp {
    belowObj: GameObj<PosComp>;
}

export function below(obj: GameObj<PosComp>, pad: number): BelowComp {
    return {
        id: "below",
        require: ["pos"],
        belowObj: obj,
        update(this: GameObj<PosComp | AnchorComp | RectComp>) {
            const otherBottom = (K.anchorToVec2((obj as any).anchor ?? K.Vec2.ZERO).y + 1) * ((obj as any).height ?? 0) / 2;
            const myAnchor = (K.anchorToVec2(this.anchor ?? K.Vec2.ZERO).y + 1) * (this.height ?? 0) / 2;
            this.worldPos = obj.pos.add(0, otherBottom + myAnchor + pad);
        },
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
                K.pos(),
                K.layer(K._k.game.layers!.at(-1)!),
                below(self, PAD),
                {
                    draw() {
                        if (!self.isHovering() && !self.is("focused")) return;
                        const text = K.sub(this.rawText());
                        const color = K.rgb(GameManager.getUIKey("colors", "normal"));
                        const fText = K.formatText({
                            text,
                            align: "left",
                            anchor: "top",
                            width: self.width - PAD,
                            styles: STYLES,
                            color,
                            size: DEF_TEXT_SIZE,
                            transform: DEF_STYLES,
                            opacity: 0.5,
                            font: GameManager.getDefaultValue("font"),
                        });
                        K.drawRect({
                            pos: K.vec2(0, -PAD / 2),
                            width: self.width,
                            radius: 2,
                            anchor: "top",
                            height: fText.height + PAD,
                            color: K.BLACK,
                            outline: {
                                color,
                                opacity: 0.5,
                                width: 2
                            }
                        });
                        K.drawFormattedText(fText);
                    },
                    rawText() {
                        return `[i]${tip}[/i]`;
                    },
                    inspect() {
                        return `tooltip: ${this.rawText()}`;
                    },
                }
            ])
        }
    }
}

export interface ScrollerComp extends Comp {
    top: number,
    bot: GameObj<PosComp>;
    scrollSpeed(speed: number): void;
    showObj(obj: GameObj<AreaComp>): void;
}
export function scroller(bottomObj: GameObj<PosComp>): ScrollerComp {
    var firstUpdate = false;
    var targeting: GameObj<AreaComp> | null = null;
    var belowObj: GameObj<PosComp> | null = null;
    return {
        id: "scroller",
        top: 0,
        bot: bottomObj,
        update(this: GameObj<PosComp | ScrollerComp | BelowComp>) {
            if (!firstUpdate) {
                this.top = this.pos.y;
                belowObj = this.belowObj;
                this.unuse("below");
                firstUpdate = true;
            } else if (targeting) {
                const bb = targeting.worldBbox();
                const targetTop = bb.pos.y - PAD;
                const targetBot = targetTop + bb.height + PAD;
                var targetScroll = this.pos.y;
                // calculate top and bottom offsets
                if (targetBot > (K.height() - PAD)) {
                    targetScroll = (K.height() - PAD) - (targetBot - this.pos.y);
                }
                if (targetTop < this.top) {
                    targetScroll = this.top - (targetTop - this.pos.y);
                }
                const bounds = calculateScrollBounds(this as any);
                targetScroll = K.clamp(targetScroll, bounds[0], bounds[1]);
                // stay centered because below() removed
                this.moveTo((belowObj ?? this).pos.x, K.lerp(this.pos.y, targetScroll, Math.LN2 * 20 * K.dt()));
            }
        },
        showObj(this: GameObj<PosComp | ScrollerComp>, obj) {
            targeting = obj;
        },
        scrollSpeed(this: GameObj<PosComp | ScrollerComp>, speed) {
            if (speed === 0) return;
            targeting = null;
            const bounds = calculateScrollBounds(this);
            this.moveTo(this.pos.x, K.clamp(this.pos.y + speed * K.dt(), bounds[0], bounds[1]));
        },
    }
}

function calculateScrollBounds(obj: GameObj<PosComp | ScrollerComp>): [number, number] {
    const containerHeight = obj.bot.pos.y - obj.pos.y;
    const maxY = obj.top;
    const minY = K.height() - PAD - containerHeight;
    return [Math.min(minY, maxY), maxY];
}
