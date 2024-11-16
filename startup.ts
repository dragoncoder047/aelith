import { GameObj, KEventController, PosComp, TextComp } from "kaplay";
import { MParser } from "./assets/mparser";
import { K } from "./init";
import { DynamicTextComp, NestedStrings } from "./plugins/kaplay-dynamic-text";
import { musicPlay } from "./assets";
import { nextFrame } from "./utils";
import { PtyChunk, PtyComp, Typable, TypableOne } from "./plugins/kaplay-pty";
import { TILE_SIZE } from "./constants";

type TextChunk = ({
    skipIf?: (vars: NestedStrings) => boolean
    clear?: boolean
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
function blah() {
    const out: TextChunk[] = [];
    for (var i = 0; i < 10; i++) {
        out.push({
            value: { text: "\ntesting..........", styles: ["selected"] }
        });
    }
    // @ts-ignore
    out.at(-1)!.value.delayBefore = 3;
    return out;
}

const CHUNKS: TextChunk[] = [
    {
        value: {
            text: "&msg.startup.pressToBegin",
        },
    },
    {
        value: {
            text: "",
            delayBefore: () => new Promise(r => K.onKeyDown("enter", () => r()))
        },
        showCursor: true
    },
    {
        value: {
            text: "&msg.startup.password",
        },
        clear: true
    },
    {
        value: {
            text: "*********",
            typewriter: true,
            sound: "typing",
            delayBefore: 1,
        },
        showCursor: true
    },
    {
        value: {
            text: "\n&msg.startup.loggedInOK\n",
            delayBefore: 1
        },
        showCursor: true
    },
    command("./gpt &", "[1] 4242 ./gpt\n&msg.startup.running\n", 1, 1, true),
    command("./gpt \"&msg.startup.findAnswer\"", "&msg.startup.segfault\n", 1, 2, false),
    {
        value: {
            text: "ai: error: EHOSTDOWN\n",
            styles: ["stderr"]
        },
    },
    {
        value: "[1]  + 4242 segmentation fault  ./gpt\n"
    },
    command("ls *.core", "4242.core\n", 3, 0.5, true),
    command("gdb pm 4242.core", "&msg.startup.startingDebugger", 0.25, 0.25, undefined),
    ...blah(),
    {
        value: { text: "" },
        showCursor: true
    }
];

export async function doStartup() {
    const terminal = MParser.vars.startupText as GameObj<TextComp | DynamicTextComp | PtyComp> | undefined;
    const title = MParser.vars.titleText as GameObj<TextComp | DynamicTextComp | PosComp> | undefined;
    const isTesting = !!MParser.vars.testingMode;

    if (!terminal || !title) throw "Missing critical elements!";

    // TODO: the rect doesn't render. Why?!?
    const container = K.add([
        K.pos(title.pos),
        K.layer("title"),
    ]);
    const rr = container.add([
        K.rect(title.width, title.height),
        K.color(K.BLACK)
    ]);
    rr.color = K.getBackground() ?? rr.color;
    title.destroy();
    container.add(title);
    title.pos = K.vec2(0);

    terminal.use(K.pty({ maxLines: 16, cursor: "[cursor]\u2588[/cursor]" }));
    // hide all
    K.get("player").forEach(p => p.hidden = p.paused = true);
    K.get("tail").forEach(p => p.hidden = p.paused = true);

    // stupid
    // why are these necessary?!?
    await nextFrame();
    await nextFrame();

    do {
        if (isTesting) {
            CHUNKS.push({ value: { text: "\nTesting mode is enabled. Be careful." }, showCursor: true });
            // @ts-ignore
            jumpWait = () => Promise.resolve();
        }

        // get vars
        terminal.data = { user: "anonymous" };
        const workDir: PtyChunk = {
            text: "~",
            styles: ["prompt"]
        };
        terminal.prompt = [
            {
                text: "&user@dev ",
                styles: ["ident"],
            },
            workDir,
            {
                text: " $ ",
                styles: ["prompt"],
            }
        ]

        for (var chunk of CHUNKS) {
            if (chunk.clear) terminal.chunks = [];
            if (chunk.skipIf && chunk.skipIf(terminal.data)) continue;
            if (chunk.isCommand) {
                await terminal.command(
                    chunk.command, chunk.output, jumpWait());
            }
            else {
                terminal.showCursor = !!chunk.showCursor;
                await terminal.type(chunk.value, jumpWait());
            }
        }

    } while (false);

    // Done typing
    K.get("player").forEach(p => p.hidden = p.paused = false);
    K.get("tail").forEach(p => p.hidden = p.paused = false);

    // Start music
    musicPlay.paused = false;

};

function promisify<T>(cb: (f: (value: T) => void) => KEventController | undefined): Promise<T> {
    var cbr: KEventController | undefined;
    const p = new Promise<T>(r => { cbr = cb(r); });
    if (cbr !== undefined) p.then(cbr.cancel);
    return p;
}

function jumpWait(): Promise<void> {
    return promisify(r => K.onButtonPress("jump", () => r()));
}
