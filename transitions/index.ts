import { GameObj, KEventController } from "kaplay";
import { K } from "../init";
import { nextFrame } from "../misc/utils";
import { DynamicTextComp } from "../plugins/kaplay-dynamic-text";
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

export type TextChunkCompressed =
    | (string | undefined)[]
    | (TextChunk & { waitKey?: string });

function decompressTextChunk(c: TextChunkCompressed): TextChunk {
    if (Array.isArray(c)) {
        if (c[0] !== "command")
            throw new Error("bad command in transition: " + JSON.stringify(c));
        console.log(c);
        return command(c[1]!, c[2]!, c[3]!, c[4]!, Boolean(c[5]), c[6]);
    }
    if (c.waitKey && !c.isCommand) {
        if (typeof c.value === "string") c.value = { text: c.value };
        c.value.delayBefore = () => new Promise(r => K.onKeyDown(c.waitKey!, () => r()));
    }
    return c;
}

function makeNumber(x: number | string): number {
    if (typeof x === "number") return x;
    if (typeof x === "string") return parseFloat(x.trim());
    return 0;
}

export function command(
    cmd: string,
    output: string,
    delayBefore: number | string,
    delayAfter: number | string,
    success?: boolean,
    workDir?: string
): TextChunk {
    return {
        isCommand: true,
        command: {
            text: cmd,
            delayBefore: makeNumber(delayBefore),
            sound: "typing",
            styles: ["command"],
            typewriter: true
        },
        output: {
            text: output,
            sound: typeof success !== "undefined" ? (success ? "command_success" : "command_fail") : undefined,
            delayBefore: makeNumber(delayAfter),
        },
        workDir,
    };
}

export async function playTransition(switchFun: () => void) {
    var u_amount = 0;
    K.usePostEffect("fuzzy", () => ({ u_amount }));
    await K.tween(0, 1, 0.5, a => u_amount = a);
    switchFun();
    await K.wait(0.4);
    await K.tween(1, 0, 0.7, a => u_amount = a);
    K.usePostEffect(null!);
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
