import { Comp, DrawTextOpt, GameObj, PosComp } from "kaplay";
import { K } from "../../context";
import * as GameManager from "../../GameManager";
import { STYLES } from "../../TextStyles";

export interface SpeechBubbleOpt {
    tokenDelay?: number;
    sentenceDelay?: number;
}

export interface SpeechBubbleComp extends Comp {
    width: number | undefined;
    text: string;
    tokenDelay: number;
    sentenceDelay: number;
    speakText(msg: string, onToken?: () => void, force?: boolean): Promise<void>;
}

const PAD = 3;
const PTR_W = 4;
const PTR_H = 5;

enum SpeechBubbleAction {
    ADD_WORD, // +word, play sound, and wait
    FINISH_SENTENCE, // wait,
    FINISH_SPEAKING, // resolve promise, and clear if nothing else to say
}

type SpeechBubbleQueueEntry = [SpeechBubbleAction, string | undefined, (() => void) | undefined];

export function speechBubble(opt: SpeechBubbleOpt = {}): SpeechBubbleComp {
    const empty = new K.Mat23;
    const queue: SpeechBubbleQueueEntry[] = [];
    var timeout = 0;
    return {
        id: "speechBubble",
        require: ["pos"],
        text: "",
        width: undefined,
        tokenDelay: opt.tokenDelay ?? 0.1,
        sentenceDelay: opt.sentenceDelay ?? 2,
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
        update() {
            if (timeout > 0) {
                timeout -= K.dt();
                return;
            }
            const action = queue.shift();
            if (!action) return;
            action[2]?.();
            switch (action[0]) {
                case SpeechBubbleAction.ADD_WORD:
                    this.text += action[1]!;
                    timeout = this.tokenDelay;
                    break;
                case SpeechBubbleAction.FINISH_SENTENCE:
                    this.text = action[1]!;
                    timeout = this.sentenceDelay;
                    break;
                case SpeechBubbleAction.FINISH_SPEAKING:
                    this.text = "";
            }
        },
        speakText(msg, onToken, force) {
            if (force) queue.length = timeout = 0;
            const s = K.sub(msg).trim();
            if (!s) return Promise.resolve();
            const sentences = segment(s, "sentence");
            const { promise, resolve } = Promise.withResolvers<void>();
            for (var i = 0; i < sentences.length; i++) {
                const sentence = sentences[i]!;
                this.text = "";
                const sen = sentence.segment.trim();
                if (!sen) continue;
                const words = segment(sen, "word");
                for (var word of words) {
                    queue.push([SpeechBubbleAction.ADD_WORD, word.segment, onToken]);
                }
                queue.push([SpeechBubbleAction.FINISH_SENTENCE, sen, ,]);
                queue.push([SpeechBubbleAction.FINISH_SPEAKING, , resolve])
            }
            return promise;
        }
    }
}

function segment(text: string, granularity: Intl.SegmenterOptions["granularity"]): Intl.SegmentData[] {
    return [...new Intl.Segmenter(K.currentLanguage(), { granularity }).segment(text)]
}
