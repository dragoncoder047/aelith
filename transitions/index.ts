import { GameObj, KEventController, TextComp } from "kaplay";
import { STYLES } from "../assets/textStyles";
import { FONT_SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { DynamicTextComp } from "../plugins/kaplay-dynamic-text";
import { PtyChunk, PtyComp, TypableOne } from "../plugins/kaplay-pty";
import { createPrompt } from "../ui/menuFactory";
import { nextFrame } from "../misc/utils";

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
            sound: typeof success !== "undefined" ? (success ? "command_success" : "command_fail") : undefined,
            delayBefore: delayAfter,
        },
        workDir,
    };
}

export async function playTransition(name: string, tran: TextChunkCompressed[], fast = false, first = false, switchFun = () => { }) {
    var u_amount = 0;
    K.usePostEffect("fuzzy", () => ({ u_amount }));
    if (!fast && !first) await K.tween(0, 1, 0.5, a => u_amount = a);
    const fader = K.add([
        K.fixed(),
        K.pos(0, 0),
        K.rect(K.width(), K.height()),
        K.color(K.getBackground()!),
        K.opacity(fast ? 0 : 1),
        K.layer("background"),
    ]);
    const term = K.add([
        K.text("", {
            styles: STYLES,
            size: 16 / FONT_SCALE,
            width: 12 * TILE_SIZE,
            align: "left",
            lineSpacing: 1.15,
        }),
        K.dynamicText(),
        K.pty({
            maxLines: 16,
            cursor: { text: "\u2588", styles: ["cursor"] },
        }),
        K.fixed(),
        K.pos(K.width() / 2, K.height() / 3),
        K.anchor("top"),
        K.color(K.WHITE.darken(100)),
        K.opacity(1),
        K.layer("text"),
    ]);
    const head = K.add([
        {
            draw(this: GameObj<TextComp>) {
                K.drawRect({ ...this, pos: K.vec2(0), color: K.getBackground()! });
            }
        },
        K.text("", {
            font: "Unscii MCR",
            styles: STYLES,
            size: 64 / FONT_SCALE,
        }),
        K.dynamicText(name),
        K.fixed(),
        K.pos(K.width() / 2, K.height() / 6),
        K.anchor("center"),
        K.opacity(1),
        K.layer("text"),
    ]);
    term.prompt = createPrompt();
    switchFun();
    if (!fast && !first) {
        await K.wait(0.4);
        await K.tween(1, 0, 0.7, a => u_amount = a);
    }
    K.usePostEffect(null!);
    if (!fast) await typeChunks(term, tran, K._k.globalOpt.debug !== false);
    [fader, head, term].forEach(x => x.fadeOut(1).onEnd(() => x.destroy()));
};

export async function typeChunks(terminal: GameObj<PtyComp | DynamicTextComp>, chunks: TextChunkCompressed[], isTesting: boolean) {
    for (var chunk of chunks.map(c => decompressTextChunk(c))) {
        if (chunk.clear) terminal.chunks = [];
        const cancel = chunk.ignoreJumpSkip && !isTesting
            ? new Promise<never>(() => { })
            : isTesting ? nextFrame() : jumpWait();
        if (chunk.isCommand) {
            await terminal.command(chunk.command, chunk.output, cancel);
        }
        else {
            terminal.showCursor = !!chunk.showCursor;
            await terminal.type(chunk.value, cancel);
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
