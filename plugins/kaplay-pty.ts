import { AreaComp, Comp, GameObj, KAPLAYCtx, PosComp, TextComp, Vec2 } from "kaplay";
import { DynamicTextComp, KAPLAYDynamicTextPlugin } from "./kaplay-dynamic-text";


export type PtyChunk = {
    text: string
    styles?: string[]
    typewriter?: boolean
    sound?: string | (() => void)
    delayBefore?: number | (() => PromiseLike<void>)
}

export type TypableOne = string | PtyChunk;
export type Typable = TypableOne | TypableOne[];

export interface PtyComp extends Comp {
    chunks: PtyChunk[]
    maxLines: number | undefined
    typeDelay(): number
    type(chunk: TypableOne | undefined, cancel?: PromiseLike<void>): Promise<void>
    prompt?: Typable
    showCursor: boolean
    cursor: Typable
    command(cmdText: Typable, output?: Typable, cancel?: PromiseLike<void>): Promise<void>
}

export interface PtyCompOpt {
    text?: TypableOne
    typeDelay?(): number
    maxLines?: number,
    cmdPrompt?: string
    cursor?: Typable
}

export interface PtyMenuComp extends Comp {
    begin(): Promise<void>
    quit(): Promise<void>
    doit(): Promise<void>
    switch(direction: Vec2): void
    back(): Promise<void>
    value(path?: string): string | string[]
    readonly disabled: boolean
    backStack: PtyMenu[] // stuff to go back to
    menu: PtyMenu
    selIdx: number
    selStyle: string
    ptrText: string
    playSoundCb(sound: string): void
    __menuChanged(): Promise<void>
    __updateSelected(): void
}

export type PtyMenu = {
    name: string,
    styles?: string[]
} & ({
    type: "submenu"
    opts: PtyMenu[]
    numColumns: number
} | ({
    type: "action"
    action(what: PtyMenu): PromiseLike<void>,
} & Object) | {
    type: "select"
    opts: string[]
    multiple: true
    selected: number[]
} | {
    type: "select"
    opts: string[]
    multiple?: false
    selected: number
})

export interface PtyMenuCompOpt {
    playSoundCb?(sound: string): void
    sound?: {
        doit?: string
        switch?: string
        back?: string
        error?: string
    },
    clearOnSubmenu?: boolean
}

export interface KAPLAYPtyComp {
    pty(opt: PtyCompOpt): PtyComp
    ptyMenu(menu: PtyMenu, opt?: PtyMenuCompOpt): PtyMenuComp
}

export function kaplayPTY(K: KAPLAYCtx & KAPLAYDynamicTextPlugin): KAPLAYPtyComp {
    return {
        pty(opt) {
            var desiredPos: Vec2;
            return {
                id: "pty",
                require: ["dynamic-text", "text", "pos"],
                chunks: [],
                typeDelay: opt?.typeDelay ?? (() => K.rand(0.1, 0.2)),
                prompt: opt.cmdPrompt,
                showCursor: false,
                cursor: opt.cursor ?? "\u2588",
                maxLines: opt.maxLines,
                add(this: GameObj<PtyComp | AreaComp | PosComp>) {
                    if (opt?.text) this.type(opt.text);
                    // this.onClick(() => this.processClick(K.fromScreen(K.mousePos())));
                    if (this.is("offscreen")) this.unuse("offscreen");
                    desiredPos = this.pos;
                    if (this.maxLines !== undefined && this.is("anchor") && ["topleft", "topright"].indexOf((this as any).anchor) !== -1)
                        throw new Error("anchor must be top if maxLines is used");
                },
                async type(this: GameObj<PtyComp | DynamicTextComp | TextComp>, chunk, cancel) {
                    if (chunk === undefined) return;
                    if (typeof chunk === "string") chunk = { text: chunk };
                    await Promise.race([cancel, (typeof chunk.delayBefore === "number" ? K.wait(chunk.delayBefore) : chunk.delayBefore?.())]);
                    this.chunks.push(chunk);
                    const sound = () => (typeof chunk.sound === "string" ? K.play(chunk.sound) : chunk.sound?.());
                    if (chunk.typewriter) {
                        const realText = K.sub(chunk.text, this.data);
                        chunk.text = "";
                        for (var ch of realText) {
                            chunk.text += ch;
                            sound();
                            await Promise.race([cancel, K.wait(this.typeDelay())]);
                        }
                    } else {
                        sound();
                    }
                },
                update(this: GameObj<PtyComp | DynamicTextComp | TextComp | PosComp>) {
                    // process the text in the chunks
                    this.t = this.chunks.map(chunk => chunk.styles ? style(esc(chunk.text), chunk.styles) : esc(chunk.text)).join("") + (this.showCursor ? this.cursor : "");
                    if (this.maxLines) {
                        const numLines = this.height / this.textSize;
                        const overLines = numLines - this.maxLines;
                        if (overLines >= 1) {
                            this.pos = K.lerp(this.pos, desiredPos.sub(0, this.textSize * overLines), 0.1);
                        }
                    }
                },
                async command(cmdText, output, cancel) {
                    if (typeof cmdText === "string") cmdText = { text: cmdText, typewriter: true };
                    if (this.prompt) {
                        if (Array.isArray(this.prompt)) for (var oe of this.prompt) await this.type(shallowCopy(oe), cancel)
                        else await this.type(shallowCopy(this.prompt), cancel);
                    }
                    this.showCursor = true;
                    if (Array.isArray(cmdText)) for (var oe of cmdText) await this.type(oe, cancel);
                    else await this.type(cmdText, cancel);
                    const all = Array.isArray(output) ? output : [output];
                    // @ts-ignore
                    await Promise.race([cancel, (typeof all[0].delayBefore === "number" ? K.wait(all[0].delayBefore) : all[0].delayBefore?.())]);
                    if (all[0] && typeof all[0] !== "string") delete all[0].delayBefore;
                    this.showCursor = false;
                    await this.type("\n", cancel);
                    for (var r of all) await this.type(r);
                },
            }
        },
        ptyMenu(menu, opt = {}) {
            var disabled = true;
            var beginLen = 0;
            var optionChunks: PtyChunk[] = [];
            return {
                id: "pty-menu",
                require: ["pty"],
                backStack: [],
                menu: menu,
                selIdx: 0,
                selStyle: "selected",
                ptrText: "\u001a",
                playSoundCb: opt.playSoundCb ?? K.play,
                get disabled() { return disabled; },
                async begin(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (!disabled) throw new Error("already began!");
                    this.backStack = [];
                    disabled = false;
                    beginLen = this.chunks.length;
                    await this.__menuChanged();
                },
                async quit(this: GameObj<PtyMenuComp | PtyComp>) {
                    // only show the final command
                    this.chunks = this.chunks.slice(0, beginLen);
                    await this.__menuChanged();
                    this.backStack = [];
                    disabled = true;
                },
                async __menuChanged(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (disabled) return;
                    if (opt.clearOnSubmenu) this.chunks = this.chunks.slice(0, beginLen);
                    const commandChunks = this.backStack.map(c => ({ text: c.name, styles: c.styles }) as TypableOne);
                    const outChunks: PtyChunk[] = []
                    switch (this.menu.type) {
                        case "submenu":
                            for (var i = 0; i < this.menu.opts.length; i++) {
                                const c = {
                                    text: this.menu.opts[i]!.name,
                                    styles: this.menu.opts[i]!.styles
                                }
                                outChunks.push(c);
                                optionChunks.push(c);
                                if (((i + 1) % this.menu.numColumns) === 0) outChunks.push({ text: "\n" });
                            };
                            commandChunks.push(...(Array.isArray(this.cursor) ? this.cursor : [this.cursor]));
                            this.__updateSelected();
                            break;
                        case "action":
                            // no output
                            break;
                        case "select":
                            for (var i = 0; i < this.menu.opts.length; i++) {
                                const si = { text: "" };
                                const c = { text: " " + this.menu.opts[i] + "\n" };
                                outChunks.push(si, c);
                                optionChunks.push(si, c);
                            };
                            this.__updateSelected();
                            break;
                        default:
                            throw new Error("Unknown menu type " + (this.menu as any).type);
                    }
                    await this.command(commandChunks, outChunks);
                    if (!opt.clearOnSubmenu) beginLen = this.chunks.length;
                },
                __updateSelected() {
                    if (disabled) return;
                    switch (this.menu.type) {
                        case "submenu":
                            for (var i = 0; i < this.menu.opts.length; i++) {
                                const chunk = optionChunks[i]!;
                                if (i === this.selIdx) {
                                    if (!chunk.styles?.includes(this.selStyle)) {
                                        if (!chunk.styles) chunk.styles = [this.selStyle];
                                        else chunk.styles.push(this.selStyle);
                                    }
                                } else {
                                    if (chunk.styles?.includes(this.selStyle)) chunk.styles = chunk.styles.filter(s => s !== this.selStyle);
                                }
                            }
                            break;
                        case "action":
                            // no output
                            break;
                        case "select":
                            for (var i = 0; i < this.menu.opts.length; i++) {
                                const siChunk = optionChunks[i * 2]!;
                                const textChunk = optionChunks[i * 2 + 1]!;
                                if (i === this.selIdx) {
                                    if (!textChunk.styles?.includes(this.selStyle)) {
                                        if (!textChunk.styles) textChunk.styles = [this.selStyle];
                                        else textChunk.styles.push(this.selStyle);
                                    }
                                } else {
                                    if (textChunk.styles?.includes(this.selStyle)) textChunk.styles = textChunk.styles.filter(s => s !== this.selStyle);
                                }
                                var st = i === this.selIdx ? this.ptrText : " ".repeat(this.ptrText.length);
                                if (this.menu.multiple) {
                                    st += `[${this.menu.selected.includes(i) ? "*" : " "}]`;
                                } else {
                                    st += `(${this.menu.selected === i ? "*" : " "})`;
                                }
                                siChunk.text = st;
                            }
                            break;
                        default:
                            throw new Error("Unknown menu type " + (this.menu as any).type);
                    }
                },
                async doit(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (disabled) return;
                    switch (this.menu.type) {
                        case "submenu":
                            this.backStack.push(this.menu);
                            this.menu = this.menu.opts[this.selIdx]!;
                            this.selIdx = 0;
                            await this.__menuChanged();
                            if (this.menu.type === "action") {
                                await this.doit();
                                this.quit();
                                await this.begin();
                            }
                            break;
                        case "action":
                            await this.menu.action(this.menu);
                            break;
                        case "select":
                            if (this.menu.multiple) {
                                if (this.menu.selected?.includes(this.selIdx)) {
                                    this.menu.selected = this.menu.selected.filter(s => s !== this.selIdx);
                                } else if (this.menu.selected) this.menu.selected.push(this.selIdx);
                                else this.menu.selected = [this.selIdx];
                            } else {
                                this.menu.selected = this.selIdx;
                            }
                            break;
                        default:
                            throw new Error("Unknown menu type " + (this.menu as any).type);
                    }
                    if (opt?.sound?.doit) this.playSoundCb?.(opt.sound.doit)
                },
                async back(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (disabled) return;
                    if (!this.backStack) {
                        if (opt?.sound?.error) this.playSoundCb?.(opt.sound.error);
                        return;
                    }
                    if (opt?.sound?.back) this.playSoundCb?.(opt.sound.back)
                    this.menu = this.backStack.pop()!;
                    this.chunks = this.chunks.slice(0, beginLen);
                    await this.__menuChanged();
                },
                switch(direction) {
                    if (disabled) return;
                    direction = direction.toAxis();
                    const origIndex = this.selIdx;
                    if (this.menu.type !== "action") {
                        this.selIdx += direction.x + ((this.menu as any).numColumns ?? 1) * direction.y;
                        this.selIdx = K.clamp(this.selIdx, 0, this.menu.opts.length - 1);
                    }
                    if (origIndex === this.selIdx) {
                        if (opt?.sound?.error) this.playSoundCb?.(opt.sound.error);
                    } else if (opt?.sound?.switch) this.playSoundCb?.(opt.sound.switch);
                },
                value(path = "") {
                    const parts = path.split(".");
                    var mm = this.backStack[0] ?? this.menu;
                    for (var part of parts) {
                        switch (mm.type) {
                            case "action":
                            case "select":
                                throw "bad";
                            case "submenu":
                                mm = mm.opts.find(m => m.name === part)!;
                                break;
                            default:
                                throw "bad";
                        }
                    }
                    if (mm.type === "select") {
                        return mm.multiple ? mm.selected.map(i => (mm as any).opts[i]) : mm.opts[mm.selected]!;
                    } else throw "bad";
                },
            }
        },
    }
}

function esc(s: string): string {
    return s.replace(/(?<!\\)([\[\\])/g, "\\$1");
}

function style(s: string, styles: string[]): string {
    return `${styles.map(s => s ? `[${s}]` : "").join("") ?? ""}${s}${styles.toReversed().map(s => s ? `[/${s}]` : "").join("") ?? ""}`
}

function shallowCopy<T>(x: T): T {
    return Object.assign({}, x);
}
