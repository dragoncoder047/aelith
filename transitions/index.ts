import { GameObj, KEventController } from "kaplay";
import { STYLES } from "../assets/textStyles";
import { FONT_SCALE } from "../constants";
import { K } from "../init";
import { DynamicTextComp, NestedStrings } from "../plugins/kaplay-dynamic-text";
import { PtyChunk, PtyComp, TypableOne } from "../plugins/kaplay-pty";

export type TextChunk = ({
    clear?: boolean,
    ignoreJumpSkip?: boolean
} & ({
    isCommand?: false
    value: TypableOne
    showCursor?: boolean
} | {
    isCommand: true
    command: PtyChunk
    output: PtyChunk,
    workDir?: string
}));

type TextChunkCompressed =
    | ["command", string, string, number, number, boolean | undefined, string | undefined]
    | (TextChunk & { waitKey?: string });

function decompressTextChunk(c: TextChunkCompressed): TextChunk {
    if (Array.isArray(c)) {
        if (c[0] !== "command")
            throw new Error("bad command in transition: " + JSON.stringify(c));
        return command(c[1], c[2], c[3], c[4], c[5], c[6]);
    }
    if (c.waitKey && !c.isCommand) {
        if (typeof c.value === "string") c.value = { text: c.value };
        c.value.delayBefore = () => new Promise(r => K.onKeyDown(c.waitKey!, () => r()))
    }
    return c;
}

function command(
    cmd: string,
    output: string,
    delayBefore: number,
    delayAfter: number,
    success: boolean | undefined,
    workDir?: string
): TextChunk {
    return {
        isCommand: true,
        command: {
            text: cmd,
            delayBefore,
            sound: "typing",
            styles: ["command"],
            typewriter: true
        },
        output: {
            text: output,
            sound: typeof success === "boolean" ? (success ? "command_success" : "command_fail") : undefined,
            delayBefore: delayAfter,
        },
        workDir,
    };
}

export async function playTransition(name: string, tran: TextChunkCompressed[]) {
    var u_amount = 0;
    K.usePostEffect("fuzzy", () => ({ u_amount }));
    await K.tween(0, 1, 0.5, a => u_amount = a);
    const rect = K.add([
        K.fixed(),
        K.rect(K.width(), K.height()),
        K.color(K.getBackground()!),
        K.opacity(),
    ]);
    const head = K.add([
        K.text("", {
            font: "Unscii MCR",
            styles: STYLES,
            size: 64 / FONT_SCALE,
        }),
        K.dynamicText(name),
        K.fixed(),
        K.pos(K.width() / 2, K.height() / 4),
        K.anchor("center"),
        K.color(K.getBackground()!),
        K.opacity(),
    ]);
    const term = K.add([
        K.text("", {
            styles: STYLES,
            size: 16 / FONT_SCALE,
        }),
        K.dynamicText(),
        K.pty({
            maxLines: 16,
            cursor: { text: "\u2588", styles: ["cursor"] }
        }),
        K.fixed(),
        K.pos(K.width() / 2, K.height() / 4),
        K.anchor("center"),
        K.color(K.getBackground()!),
        K.opacity(),
    ]);
    await K.wait(0.2);
    await K.tween(1, 0, 0.7, a => u_amount = a);
    K.usePostEffect(null!);
    await typeChunks(term, tran, K._k.globalOpt.debug !== false);
    [rect, head, term].forEach(x => x.fadeOut(1).then(() => x.destroy()));
};

async function typeChunks(terminal: GameObj<PtyComp | DynamicTextComp>, chunks: TextChunkCompressed[], isTesting: boolean) {
    for (var chunk of chunks.map(decompressTextChunk)) {
        if (chunk.clear) terminal.chunks = [];
        if (chunk.isCommand) {
            await terminal.command(
                chunk.command, chunk.output,
                chunk.ignoreJumpSkip && !isTesting
                    ? new Promise(() => { })
                    : jumpWait());
        }
        else {
            terminal.showCursor = !!chunk.showCursor;
            await terminal.type(chunk.value,
                chunk.ignoreJumpSkip && !isTesting
                    ? new Promise(() => { })
                    : jumpWait());
        }
    }
}


function promisify<T>(cb: (f: (value: T) => void) => KEventController | undefined): Promise<T> {
    var cbr: KEventController | undefined;
    const p = new Promise<T>(r => { cbr = cb(r); });
    if (cbr !== undefined) p.then(cbr.cancel);
    return p;
}

function jumpWait(): Promise<void> {
    return promisify(r => K.onButtonPress("jump", () => r()));
}
