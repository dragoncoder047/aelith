import { Comp, DrawTextOpt, GameObj, PosComp } from "kaplay";
import { K } from "../../../src/context";
import * as GameManager from "../../GameManager";
import { STYLES } from "../../TextStyles";

export interface SpeechBubbleComp extends Comp {
    width: number | undefined;
    text: string;
}

const PAD = 3;
const PTR_W = 4;
const PTR_H = 5;

export function speechBubble(): SpeechBubbleComp {
    const empty = new K.Mat23;
    return {
        id: "speechBubble",
        require: ["pos"],
        text: "",
        width: undefined,
        draw(this: GameObj<SpeechBubbleComp | PosComp>) {
            if (this.text === "") return;
            K.pushTransform();
            K.pushMatrix(empty);
            K.pushTranslate(this.worldPos);
            const textOpt: DrawTextOpt = {
                text: this.text,
                styles: STYLES,
                color: K.BLACK,
                align: "center",
                anchor: "bot",
                size: 8,
                font: GameManager.getDefaultValue("font"),
                pos: K.vec2(0, -PAD - PTR_H),
            };
            var t = K.formatText(textOpt);
            if (this.width && t.width > this.width) {
                textOpt.width = this.width;
                t = K.formatText(textOpt);
            }
            // arrow
            K.drawPolygon({
                pts: [K.Vec2.ZERO, K.vec2(-PTR_W / 2, -PTR_H), K.vec2(PTR_W / 2, -PTR_H)],
                color: K.WHITE,
            });
            K.drawRect({
                width: t.width + PAD * 2,
                height: t.height + PAD * 2,
                anchor: "bot",
                color: K.WHITE,
                radius: [PAD, PAD, PAD, PAD],
                pos: K.vec2(0, -PTR_H),
            });
            K.drawFormattedText(t);
            K.popTransform();
        },
    }
}

export function segment(text: string, granularity: Intl.SegmenterOptions["granularity"]): Intl.SegmentData[] {
    return [...new Intl.Segmenter(K.currentLanguage(), { granularity }).segment(text)]
}
