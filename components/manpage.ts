import { Color, Comp, GameObj, SpriteComp } from "kaplay";
import { STYLES } from "../assets/textStyles";
import { K } from "../init";
import { FONT_SCALE, SCALE } from "../constants";
import { NestedStrings } from "../plugins/kaplay-dynamic-text";

export interface ManpageComp extends Comp {
    section: string
    header: string
    size: number
    body: string
    scrollPos: number
    margin: number
    showFooter: boolean
    sprite: GameObj<SpriteComp> | undefined
    bg: Color
    needsToScroll: boolean
    data: NestedStrings
}

export function manpage(opt: { bg?: Color } = {}): ManpageComp {
    return {
        id: "manpage",
        section: "undefined",
        header: "undefined",
        size: 12 / SCALE,
        body: "undefined",
        bg: opt.bg ?? K.BLACK.lighten(20),
        scrollPos: 0,
        margin: 10 / SCALE,
        sprite: undefined,
        needsToScroll: false,
        showFooter: true,
        data: {},
        draw() {
            const theHeight = K.height() * 5 / 6;
            const theWidth = K.width() * 2 / 3;
            const topLeft = K.vec2(-theWidth / 2, -theHeight / 2);
            const secTxt = K.formatText({
                text: K.sub(this.section, this.data),
                size: this.size,
                pos: topLeft,
                anchor: "topleft",
                styles: STYLES,
                color: K.WHITE.darken(100),
            });
            const headerTxt = K.formatText({
                ...this,
                ...secTxt.opt,
                text: K.sub(this.header),
                pos: topLeft.add(theWidth / 2, 0),
                anchor: "top"
            })
            const botTxt = K.formatText({
                text: ":[cursor]\u2588[/cursor]",
                anchor: "botleft",
                align: "left",
                pos: topLeft.add(0, theHeight),
                size: this.size,
                styles: STYLES,
                color: K.WHITE.darken(100),
            });
            const midTxt = K.formatText({
                text: K.sub(this.body, this.data),
                size: this.size,
                align: "left",
                lineSpacing: 2,
                styles: STYLES,
                color: K.WHITE.darken(100),
                anchor: "topleft",
                width: theWidth,
                indentAll: true
            });
            const headerHeight = Math.max(!!this.section ? secTxt.height : 0, !!this.header ? headerTxt.height : 0);
            const maxScroll = Math.max(0, midTxt.height - theHeight + (this.showFooter ? botTxt.height : 0) + headerHeight + 2 * this.margin + (this.sprite ? this.sprite.height + 2 * this.margin : 0));
            this.needsToScroll = maxScroll > 0;
            this.scrollPos = K.clamp(this.scrollPos, 0, maxScroll);
            const toppos = -this.scrollPos + headerHeight + this.margin;
            // background
            K.drawRect({
                ...this,
                pos: K.vec2(0),
                width: theWidth + this.margin * 2,
                height: theHeight + this.margin * 2,
                anchor: "center",
                color: this.bg,
            })
            // body
            K.drawMasked(() => {
                // the text
                K.drawFormattedText(K.formatText({
                    ...this,
                    ...midTxt.opt,
                    pos: K.vec2(0, toppos + (this.sprite ? this.sprite.height + this.margin : 0)).add(topLeft),
                }));
                // the sprite
                if (this.sprite)
                    K.drawSprite({
                        ...this,
                        ...this.sprite,
                        pos: K.vec2(theWidth / 2, toppos).add(topLeft),
                        anchor: "top",
                        flipX: false,
                        frame: 0,
                    });
            }, () => {
                // bounding rect
                K.drawRect({
                    anchor: "center",
                    pos: K.vec2(0),
                    width: theWidth,
                    height: theHeight,
                });
            });
            // section
            K.drawRect({
                ...this,
                color: this.bg,
                pos: K.vec2(0, -theHeight / 2 - this.margin / 2),
                width: theWidth,
                height: headerHeight + this.margin,
                anchor: "top",
            });
            K.drawFormattedText(secTxt);
            K.drawFormattedText(K.formatText({
                ...this,
                ...secTxt.opt,
                pos: topLeft.add(theWidth, 0),
                anchor: "topright"
            }));
            K.drawFormattedText(headerTxt);
            if (!this.showFooter) return;
            // footer
            K.drawRect({
                ...this,
                color: this.bg,
                pos: K.vec2(0, theHeight / 2 + this.margin / 2),
                anchor: "bot",
                width: theWidth,
                height: botTxt.height + this.margin,
            });
            if (this.scrollPos < maxScroll)
                K.drawFormattedText(botTxt);
            else {
                K.drawFormattedText(K.formatText({
                    ...this,
                    ...botTxt.opt,
                    text: "(END)",
                    shader: "invert",
                    uniform: { u_bg_color: K.WHITE },
                }));
            }
        }
    }
}
