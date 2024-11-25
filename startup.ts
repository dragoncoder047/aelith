import { GameObj, KEventController, PosComp, TextComp, Vec2 } from "kaplay";
import { MParser } from "./assets/mparser";
import { K } from "./init";
import { DynamicTextComp, NestedStrings } from "./plugins/kaplay-dynamic-text";
import { musicPlay } from "./assets";
import { nextFrame } from "./utils";
import { PtyChunk, PtyComp, TypableOne } from "./plugins/kaplay-pty";
import { initPauseMenu } from "./controls/pauseMenu";

export type TextChunk = ({
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

export function command(
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

const CHUNKS: TextChunk[] = [
    {
        value: "&msg.startup.pressToBegin",
    },
    {
        value: {
            text: "",
            delayBefore: () => new Promise(r => K.onKeyDown("enter", () => r()))
        },
        showCursor: true
    },
    {
        value: "&msg.startup.password",
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
    command("sudo ./gpt --access=all &", "&msg.startup.running\n[1] 4242 sudo ./gpt\n", 1, 1, true),
    command("./gpt --interactive", "", 1, 0.5, undefined),
    {
        value: "connecting...",
    },
    {
        value: {
            text: "connected!\nask AI > ",
            delayBefore: 1
        }
    },
    {
        value: {
            text: "&msg.startup.findAnswer\n",
            typewriter: true,
            delayBefore: 1,
            styles: ["command"],
            sound: "typing"
        },
        showCursor: true
    },
    {
        value: {
            text: "[1]  + 4242 &msg.startup.segfault  sudo ./gpt\n",
            delayBefore: 2,
        },
        showCursor: true
    },
    {
        value: {
            text: "&msg.startup.disconnected\n",
            styles: ["stderr"],
            sound: "command_fail"
        }
    },
    command("ls *.core", "4242.core\n", 3, 0.5, true),
    command("gdb pm 4242.core", "&msg.startup.startingDebugger", 0.25, 0.25, undefined),
    {
        value: "",
        showCursor: true
    }
];

export async function funnyType(terminal: GameObj<PtyComp | DynamicTextComp>, chunks: TextChunk[]) {
    for (var chunk of chunks) {
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
}

export async function doStartup() {
    const terminal = MParser.vars.startupText as GameObj<TextComp | DynamicTextComp | PtyComp | PosComp> | undefined;
    const title = MParser.vars.titleText as GameObj<TextComp | DynamicTextComp | PosComp> | undefined;
    const isTesting = !!MParser.vars.testingMode;

    if (!terminal || !title) throw "Missing critical elements!";

    const terminalPos = terminal.worldPos()!;
    terminal.destroy();
    K.add(terminal);
    terminal.pos = terminalPos;

    const container = K.add([
        K.pos(title.pos),
        K.layer("title"),
    ]);
    const rr = container.add([
        K.pos(0),
        K.rect(10, 10), // dummy values
        K.color(K.BLACK),
        K.area()
    ]);
    rr.color = K.getBackground() ?? rr.color;
    title.destroy();
    container.add(title);
    title.pos = K.vec2(0);
    const zz = title.onUpdate(() => {
        if (title.width > 0 && title.height > 0) {
            rr.width = title.width;
            rr.height = title.height;
            zz.cancel();
        }
    });

    terminal.use(K.pty({ maxLines: 16, cursor: { text: "\u2588", styles: ["cursor"] } }));

    // hide all
    K.get("player").forEach(p => p.hidden = p.paused = true);
    K.get("tail").forEach(p => p.hidden = p.paused = true);
    MParser.pauseWorld(true);

    // stupid
    // why are these necessary?!?
    await nextFrame();
    await nextFrame();

    do {
        if (isTesting) {
            CHUNKS.push({ value: { text: "\nTesting mode is enabled. Be careful.\n" }, showCursor: true });
            // @ts-ignore
            jumpWait = () => Promise.resolve();
        }

        // get vars
        terminal.data = { user: "anonymous" };
        const workDir: PtyChunk = {
            text: "/home/&user",
            styles: ["prompt"]
        };
        terminal.prompt = [
            {
                text: "\u250C&user@dev ",
                styles: ["ident"],
            },
            workDir,
            {
                text: "\n\u2514\u25BA$ ",
                styles: ["ident"],
            }
        ];

        await funnyType(terminal, CHUNKS);

    } while (false);

    // Done typing
    K.get("player").forEach(p => p.hidden = p.paused = false);
    K.get("tail").forEach(p => p.hidden = p.paused = false);
    MParser.pauseWorld(false);

    initPauseMenu(terminal);

    // Start music
    musicPlay.paused = isTesting; // will be false if not testing mode

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
