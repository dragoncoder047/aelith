import { Color, Comp, GameObj, SpriteComp } from "kaplay";
import { STYLES } from "../assets/textStyles";
import { K } from "../init";
import { FONT_SCALE, SCALE } from "../constants";

export interface ManpageComp extends Comp {
    section: string
    header: string
    size: number
    body: string
    scrollPos: number
    margin: number
    sprite: GameObj<SpriteComp> | undefined
    bg: Color
    needsToScroll: boolean
}

export function manpage(): ManpageComp {
    return {
        id: "manpage",
        section: "undefined",
        header: "undefined",
        size: 16 / FONT_SCALE,
        body: "undefined",
        bg: K.BLACK.lighten(20),
        scrollPos: 0,
        margin: 10 / SCALE,
        sprite: undefined,
        needsToScroll: false,
        draw() {
            const theHeight = K.height() * 5 / 6;
            const theWidth = K.width() * 2 / 3;
            const topLeft = K.vec2(-theWidth / 2, -theHeight / 2);
            const secTxt = K.formatText({
                text: K.sub(this.section),
                size: this.size,
                pos: topLeft,
                anchor: "topleft",
                styles: STYLES,
                color: K.WHITE.darken(100),
            });
            const botTxt = K.formatText({
                text: ":[cursor]\u2588[/cursor]",
                anchor: "botleft",
                align: "left",
                pos: topLeft.add(0, theHeight),
                size: this.size,
                styles: STYLES,
                color: K.WHITE.darken(100),
            });
            const toppos = -this.scrollPos + secTxt.height + this.margin;
            const midTxt = K.formatText({
                text: K.sub(this.body),
                size: this.size,
                align: "left",
                lineSpacing: 2,
                pos: K.vec2(0, toppos + (this.sprite ? this.sprite.height + this.margin : 0)).add(topLeft),
                styles: STYLES,
                color: K.WHITE.darken(100),
                anchor: "topleft",
                width: theWidth,
                indentAll: true
            });
            const maxScroll = Math.max(0, midTxt.height - theHeight + botTxt.height + secTxt.height + 2 * this.margin + (this.sprite ? this.sprite.height + 2 * this.margin : 0));
            this.needsToScroll = maxScroll > 0;
            this.scrollPos = K.clamp(this.scrollPos, 0, maxScroll);
            // background
            K.drawRect({
                pos: K.vec2(0),
                width: theWidth + this.margin * 2,
                height: theHeight + this.margin * 2,
                anchor: "center",
                color: this.bg,
            })
            // body
            K.drawMasked(() => {
                // the text
                K.drawFormattedText(midTxt);
                // the sprite
                if (this.sprite)
                    K.drawSprite({
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
                color: this.bg,
                pos: K.vec2(0, -theHeight / 2 - this.margin / 2),
                width: theWidth,
                height: secTxt.height + this.margin,
                anchor: "top",
            });
            K.drawFormattedText(secTxt);
            K.drawFormattedText(K.formatText({
                ...secTxt.opt,
                pos: topLeft.add(theWidth, 0),
                anchor: "topright"
            }));
            K.drawFormattedText(K.formatText({
                ...secTxt.opt,
                text: K.sub(this.header),
                pos: topLeft.add(theWidth / 2, 0),
                anchor: "top"
            }));
            // footer
            K.drawRect({
                color: this.bg,
                pos: K.vec2(0, theHeight / 2 + this.margin / 2),
                anchor: "bot",
                width: theWidth,
                height: botTxt.height + this.margin,
            });
            K.drawFormattedText(botTxt);
        }
    }
}
