import { GameObj, KEventController, TextComp } from "kaplay";
import { MParser } from "./assets/mparser";
import { DynamicTextComp } from "./components/dynamicText";
import { player } from "./player";
import { K } from "./init";
import { processTextReplacements } from "./utils";

type TextChunk = {
    text: string
    style?: string
    typewriter?: boolean,
    wait?: number,
    skipIf?: (vars: Record<string, string>) => boolean,
};

function command(
    cmdStr: string,
    output: string,
    workingDir: string,
    waitBeforeCommand: number,
    waitAfterCommand: number
): TextChunk[] {
    return [
        {
            text: "\n{{user}}@dev ",
            style: "ident",
        },
        {
            text: workingDir + " $ ",
            style: "prompt",
            wait: waitBeforeCommand
        },
        {
            text: cmdStr,
            typewriter: true,
            style: "command",
            wait: waitAfterCommand
        },
        ...(
            output !== "" ?
                [{
                    text: "\n" + output
                }]
                : [])
    ];
}

const chunks: TextChunk[] = [
    {
        text: "Password for {{user}}: ",
        wait: 1
    },
    {
        text: "*********",
        typewriter: true,
        wait: 1
    },
    {
        text: "\nLogged in!",
    },
    ...command("sudo ai-assistant &", "(1) 4242 ai-assistant\nAssistant is running", "~", 1, 1),
    ...command("ai \"find the answer\"", "Segmentation fault (core dumped)"
        + "\n(1)  + 4242 exit 139   ai-assistant\n[stderr]ai: error: EHOSTDOWN[/stderr]", "~", 1, 2),
    ...command("cd /sys/ai", "", "~", 3, 0.25),
    ...command("gdb pm", "Starting debugger...", "/sys/ai", 0.25, 0.25),
];

export async function doStartup() {
    // hide all
    const startupTextElement = MParser.vars.startupText! as GameObj<TextComp>;
    const bottomControlsElement = MParser.vars.moveControl! as GameObj<TextComp | DynamicTextComp>;
    player.hidden = true;
    player.paused = true;
    const oldTextFunc = bottomControlsElement.textFunc;
    bottomControlsElement.textFunc = undefined;
    bottomControlsElement.text = "";

    // get vars
    const vars = { user: "anon" };

    var runningText = "";
    var typedText = "";
    var typedTextStyle: string | undefined = undefined;
    const refresh = () => {
        startupTextElement.text = [runningText, wrap(typedText, typedTextStyle), wrap("_", "cursor")].join("");
    };
    const say = (text: string, style: string | undefined) => {
        runningText += wrap(text, style);
        refresh();
    };
    const type = (text: string) => {
        typedText += text;
        refresh();
    };

    for (var chunk of chunks) {
        if (chunk.skipIf && chunk.skipIf(vars)) continue;
        const text = processTextReplacements(chunk.text, vars);
        if (chunk.typewriter) {
            typedTextStyle = chunk.style;
            var stop = false;
            await jumpWait((async () => {
                for (var ch of text) {
                    if (stop) return;
                    type(ch);
                    await K.wait(K.rand(0.1, 0.2));
                }
            })());
            stop = true;
            typedText = "";
            say(text, chunk.style);
        } else {
            say(text, chunk.style);
        }
        if (chunk.wait) {
            await jumpWait(K.wait(chunk.wait) as unknown as Promise<void>);
        }
    }

    // Done typing
    bottomControlsElement.textFunc = oldTextFunc;
    player.hidden = false;
    player.paused = false;
};

function wrap(text: string, style: string | undefined) {
    if (style === "" || text === "") return text;
    return `[${style}]${text}[/${style}]`;
}

function promisify(cb: (f: (value: any) => void) => KEventController | undefined): Promise<void> {
    var cbr: KEventController | undefined = undefined;
    const p = new Promise<void>(r => { cbr = cb(r); });
    if (cbr !== undefined) p.then((cbr as KEventController).cancel);
    return p;
}

function jumpWait(p: Promise<void>): Promise<void> {
    return Promise.race([p, promisify(r => K.onButtonPress("jump", r))])
}
