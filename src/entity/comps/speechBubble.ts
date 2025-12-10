import { Comp, DrawTextOpt, GameObj } from "kaplay";
import { K } from "../../context";
import { STYLES } from "../../TextStyles";

export interface SpeechBubbleOpt {
    tokenDelay?: number;
}

export interface SpeechBubbleComp extends Comp {
    width: number | undefined;
    text: string;
    tokenDelay: number;
    isSpeaking(): boolean;
    speakText(msg: string, sentenceWaitCb?: () => Promise<void>, perTokenCb?: () => void, finishSentenceNow?: () => boolean): Promise<void>;
}

const PAD = 3;
const PTR_W = 4;
const PTR_H = 5;

export function speechBubble(opt: SpeechBubbleOpt = {}): SpeechBubbleComp {
    var isSpeaking = false;
    return {
        id: "speechBubble",
        text: "",
        width: undefined,
        tokenDelay: opt.tokenDelay ?? 0.1,
        draw(this: GameObj<SpeechBubbleComp>) {
            if (this.text === "") return;
            K.pushTransform();
            K.pushMatrix(K.Mat23.fromTranslation(this.transform.getTranslation()));
            const textOpt: DrawTextOpt = {
                text: this.text,
                styles: STYLES,
                color: K.BLACK,
                align: "center",
                anchor: "bot",
                size: 8,
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
        isSpeaking() {
            return isSpeaking;
        },
        async speakText(msg, sentenceWaitCb, perTokenCb, finishSentenceNow) {
            isSpeaking = true;
            const s = K.sub(msg).trim();
            this.text = "";
            if (s) {
                const sentences = segment(s, "sentence");
                for (var i = 0; i < sentences.length; i++) {
                    const sentence = sentences[i]!;
                    this.text = "";
                    const sen = sentence.segment.trim();
                    if (!sen) continue;
                    const words = segment(sen, "word");
                    for (var word of words) {
                        if (finishSentenceNow?.()) break;
                        await K.wait(this.tokenDelay);
                        this.text += word.segment;
                        perTokenCb?.();
                    }
                    this.text = sen;
                    try {
                        await sentenceWaitCb?.();
                    } catch (e: unknown) {
                        if (e === true) break;
                        throw e;
                    }
                }
            }
            isSpeaking = false;
            this.text = "";
        }
    }
}

function segment(text: string, granularity: Intl.SegmenterOptions["granularity"]): Intl.SegmentData[] {
    return [...new Intl.Segmenter(K.currentLanguage(), { granularity }).segment(text)]
}
