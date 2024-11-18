import { AreaComp, Comp, GameObj, KAPLAYCtx, PosComp, TextComp, Vec2 } from "kaplay";
import { DynamicTextComp, KAPLAYDynamicTextPlugin } from "./kaplay-dynamic-text";

// MARK: PtyChunk
export type PtyChunk = {
    text: string
    styles?: string[]
    typewriter?: boolean
    sound?: string | (() => void)
    delayBefore?: number | (() => PromiseLike<void>)
}

export type TypableOne = string | PtyChunk;
export type Typable = TypableOne | TypableOne[];

// MARK: PtyComp
export interface PtyComp extends Comp {
    chunks: PtyChunk[]
    maxLines: number | undefined
    typeDelay(): number
    type(chunk: TypableOne | undefined, cancel?: PromiseLike<void>): Promise<void>
    prompt?: Typable
    showCursor: boolean
    cursor: Typable
    command(cmdText: Typable, output?: Typable, cancel?: PromiseLike<void>): Promise<void>
    dropChunk(chunk: PtyChunk | PtyChunk[]): void
    toChunks(what: Typable | undefined): PtyChunk[]
    styleChunk(chunk: PtyChunk, style: string, add: boolean): void
}

// MARK: PtyCompOpt
export interface PtyCompOpt {
    text?: TypableOne
    typeDelay?(): number
    maxLines?: number,
    cmdPrompt?: string
    cursor?: Typable
}

// MARK: PtyMenuComp
export interface PtyMenuComp extends Comp {
    beginMenu(): Promise<void>
    quitMenu(): Promise<void>
    doit(): Promise<void>
    switch(direction: Vec2): Promise<void>
    back(): Promise<void>
    value(path?: string): any | any[]
    readonly disabled: boolean
    backStack: PtyMenu[] // stuff to go back to
    menu: PtyMenu
    selIdx: number
    selStyle: string
    cmdStyle: string
    ptrText: string
    playSoundCb(sound: string): void
    __menuChanged(): Promise<void>
    __updateSelected(): Promise<void>
}

// MARK: PtyMenu
export type PtyMenu = {
    name?: string
    id: string,
    styles?: string[]
} & ({
    type: "submenu"
    opts: PtyMenu[]
    numColumns?: number
} | ({
    type: "action"
    action(): PromiseLike<void>,
} & Object) | {
    type: "select"
    opts: { text: Typable, value: any }[]
    multiple: true
    selected: number[]
} | {
    type: "select"
    opts: { text: Typable, value: any }[]
    multiple?: false
    selected: number
})

// MARK: PtyMenuCompOpt
export interface PtyMenuCompOpt {
    playSoundCb?(sound: string): void
    sounds?: {
        doit?: string
        switch?: string
        back?: string
        error?: string
    },
}

// MARK: KAPLAYPtyComp
export interface KAPLAYPtyComp {
    pty(opt: PtyCompOpt): PtyComp
    ptyMenu(menu: PtyMenu, opt?: PtyMenuCompOpt): PtyMenuComp
}

export function kaplayPTY(K: KAPLAYCtx & KAPLAYDynamicTextPlugin): KAPLAYPtyComp {
    return {
        // MARK: pty()
        pty(opt) {
            var desiredPos: Vec2;
            const redraw = (obj: GameObj<PtyComp | DynamicTextComp>) => {
                // process the text in the chunks
                obj.t = obj.chunks.concat(...(obj.showCursor ? obj.toChunks(obj.cursor) : [])).map(chunk => chunk.styles ? style(esc(chunk.text), chunk.styles) : esc(chunk.text)).join("");
            };
            return {
                id: "pty",
                require: ["dynamic-text", "text", "pos"],
                chunks: [],
                typeDelay: opt?.typeDelay ?? (() => K.rand(0.02, 0.2)),
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
                // MARK: type()
                async type(this: GameObj<PtyComp | DynamicTextComp | TextComp>, chunk, cancel) {
                    if (chunk === undefined) return;
                    chunk = this.toChunks(chunk)[0]!;
                    redraw(this);
                    await Promise.race([cancel, (typeof chunk.delayBefore === "number" ? K.wait(chunk.delayBefore) : chunk.delayBefore?.())]);
                    this.chunks.push(chunk);
                    const sound = () => (typeof chunk.sound === "string" ? K.play(chunk.sound) : chunk.sound?.());
                    if (chunk.typewriter) {
                        const textNoSub = chunk.text;
                        const realText = K.sub(textNoSub, this.data);
                        chunk.text = "";
                        for (var ch of realText) {
                            chunk.text += ch;
                            redraw(this);
                            sound();
                            await Promise.race([cancel, K.wait(this.typeDelay())]);
                        }
                        chunk.text = textNoSub;
                    } else {
                        redraw(this);
                        sound();
                    }
                },
                update(this: GameObj<PtyComp | DynamicTextComp | TextComp | PosComp>) {
                    if (this.maxLines) {
                        const numLines = this.height / this.textSize;
                        const overLines = numLines - this.maxLines;
                        if (overLines >= 1) {
                            this.pos = K.lerp(this.pos, desiredPos.sub(0, this.textSize * overLines), 0.1);
                        }
                    }
                },
                // MARK: command()
                async command(this: GameObj<PtyComp | DynamicTextComp>, cmdText, output, cancel) {
                    if (typeof cmdText === "string") cmdText = { text: cmdText, typewriter: true };
                    if (this.prompt) {
                        for (var oe of this.toChunks(this.prompt)) await this.type(shallowCopy(oe), cancel)
                    }
                    this.showCursor = true;
                    redraw(this);
                    for (var oe of this.toChunks(cmdText)) await this.type(oe, cancel);
                    const all = this.toChunks(output);
                    await Promise.race([cancel, (typeof all[0]?.delayBefore === "number" ? K.wait(all[0].delayBefore) : all[0]?.delayBefore?.())]);
                    if (all[0]) delete all[0].delayBefore;
                    this.showCursor = false;
                    await this.type("\n", cancel);
                    for (var r of all) await this.type(r);
                },
                dropChunk(this: GameObj<PtyComp | DynamicTextComp>, chunk) {
                    if (Array.isArray(chunk)) chunk.forEach(c => this.dropChunk(c));
                    else if (this.chunks.includes(chunk)) {
                        this.chunks.splice(this.chunks.indexOf(chunk), 1);
                        redraw(this);
                    }
                },
                toChunks(what) {
                    if (what === undefined) return [];
                    if (Array.isArray(what)) return what.flatMap(x => this.toChunks(x));
                    if (typeof what === "string") return [{ text: what }];
                    return [what];
                },
                styleChunk(this: GameObj<PtyComp | DynamicTextComp>, chunk, style, add) {
                    if (add) {
                        if (!chunk.styles?.includes(style)) {
                            if (!chunk.styles) chunk.styles = [style];
                            else chunk.styles.push(style);
                            redraw(this);
                        }
                    } else {
                        if (chunk.styles?.includes(style)) {
                            chunk.styles = chunk.styles.filter(s => s !== style);
                            redraw(this);
                        }
                    }
                }
            }
        },
        // MARK: ptyMenu()
        ptyMenu(menu, opt = {}) {
            var disabled = true;
            var beginLen = 0;
            var optionChunks: { select: PtyChunk, chunks: PtyChunk[] }[] = [];
            var menuChunks: PtyChunk[] = [];
            var cursorChunks: PtyChunk[] = [];
            var commandChunks: PtyChunk[] = [];
            return {
                id: "pty-menu",
                require: ["pty"],
                backStack: [],
                menu: menu,
                selIdx: 0,
                selStyle: "selected",
                cmdStyle: "command",
                ptrText: "\u001a",
                playSoundCb: opt.playSoundCb ?? K.play,
                get disabled() { return disabled; },
                // MARK: beginMenu()
                async beginMenu(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (!disabled) throw new Error("already began!");
                    this.backStack = [];
                    for (var chunk of this.chunks.toReversed()) {
                        if (chunk.text !== "" && !chunk.text.endsWith("\n")) {
                            await this.type("\n");
                            break;
                        }
                    }
                    disabled = false;
                    beginLen = this.chunks.length;
                    // save for quitMenu() later
                    menu = this.menu;
                    await this.__menuChanged();
                },
                // MARK: quitMenu()
                async quitMenu(this: GameObj<PtyMenuComp | PtyComp>) {
                    // only show the final command
                    this.chunks = this.chunks.slice(0, beginLen);
                    // reset
                    this.menu = menu;
                    this.selIdx = 0;
                    this.backStack = [];
                    this.dropChunk(cursorChunks);
                    optionChunks = [];
                    menuChunks = [];
                    cursorChunks = [];
                    disabled = true;
                    await this.command(commandChunks, "");
                    commandChunks = [];
                },
                // MARK: __menuChanged()
                async __menuChanged(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (disabled) return;
                    this.chunks = this.chunks.slice(0, beginLen);
                    commandChunks = this.backStack.concat(this.menu).map(c => ({ text: c.id + " ", styles: [...(c.styles ? c.styles : []), this.cmdStyle] }) as PtyChunk);
                    const outChunks: PtyChunk[] = [];
                    menuChunks = [];
                    cursorChunks = this.toChunks(this.cursor);
                    optionChunks = [];
                    switch (this.menu.type) {
                        case "submenu":
                            // remove old cursor stuff
                            this.dropChunk(cursorChunks);
                            for (var i = 0; i < this.menu.opts.length; i++) {
                                const c = {
                                    text: this.menu.opts[i]!.name ?? this.menu.opts[i]!.id,
                                    styles: this.menu.opts[i]!.styles
                                }
                                outChunks.push(c);
                                menuChunks.push(c);
                                if (((i + 1) % (this.menu.numColumns ?? 1)) === 0) outChunks.push({ text: "\n" });
                            };
                            await this.__updateSelected();
                            break;
                        case "action":
                            // no output
                            break;
                        case "select":
                            for (var i = 0; i < this.menu.opts.length; i++) {
                                const si = { text: "" };
                                const c = [{ text: " " }, ...this.toChunks(this.menu.opts[i]!.text), { text: "\n" }];
                                outChunks.push(si, ...c);
                                optionChunks.push({ select: si, chunks: c });
                            };
                            await this.__updateSelected();
                            break;
                        default:
                            throw new Error("Unknown menu type " + (this.menu as any).type);
                    }
                    await this.command(commandChunks.concat(cursorChunks), outChunks);
                },
                // MARK: __updateSelected()
                async __updateSelected(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (disabled) return;
                    switch (this.menu.type) {
                        case "submenu":
                            for (var i = 0; i < this.menu.opts.length; i++)
                                this.styleChunk(menuChunks[i]!, this.selStyle, i === this.selIdx);
                            break;
                        case "action":
                            // no output
                            break;
                        case "select":
                            for (var i = 0; i < this.menu.opts.length; i++) {
                                const { select: siChunk, chunks: textChunks } = optionChunks[i]!;
                                this.styleChunk(siChunk, this.selStyle, i === this.selIdx);
                                var st = i === this.selIdx ? this.ptrText : " ".repeat(this.ptrText.length);
                                if (this.menu.multiple) {
                                    st += `[${this.menu.selected.includes(i) ? "*" : " "}]`;
                                } else {
                                    st += `(${this.menu.selected === i ? "*" : " "})`;
                                }
                                siChunk.text = st;
                                textChunks.forEach(c => this.styleChunk(c, this.selStyle, st.indexOf("*") !== -1));
                            }
                            // null op to force refresh
                            await this.type("");
                            this.chunks.pop();
                            break;
                        default:
                            throw new Error("Unknown menu type " + (this.menu as any).type);
                    }
                },
                // MARK: doit()
                async doit(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (disabled) return;
                    switch (this.menu.type) {
                        case "submenu":
                            this.backStack.push(this.menu);
                            this.menu = this.menu.opts[this.selIdx]!;
                            await this.__menuChanged();
                            if (this.menu.type === "action") {
                                this.dropChunk(cursorChunks);
                                await this.menu.action();
                                beginLen = this.chunks.length;
                                this.menu = this.backStack.pop()!;
                            } else this.selIdx = 0;
                            await this.__menuChanged();
                            break;
                        case "action":
                            throw "unreachable";
                        case "select":
                            if (this.menu.multiple) {
                                if (this.menu.selected?.includes(this.selIdx)) {
                                    this.menu.selected = this.menu.selected.filter(s => s !== this.selIdx);
                                } else if (this.menu.selected) this.menu.selected.push(this.selIdx);
                                else this.menu.selected = [this.selIdx];
                            } else {
                                this.menu.selected = this.selIdx;
                            }
                            await this.__updateSelected();
                            break;
                        default:
                            throw new Error("Unknown menu type " + (this.menu as any).type);
                    }
                    if (opt?.sounds?.doit) this.playSoundCb?.(opt.sounds.doit)
                },
                // MARK: back()
                async back(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (disabled) return;
                    if (this.backStack.length === 0) {
                        if (opt?.sounds?.error) this.playSoundCb?.(opt.sounds.error);
                        return;
                    }
                    if (opt?.sounds?.back) this.playSoundCb?.(opt.sounds.back);
                    const oldMenu = this.menu;
                    this.menu = this.backStack.pop()!;
                    // @ts-ignore
                    this.selIdx = this.menu.opts.indexOf(oldMenu);
                    optionChunks.forEach(c => (this.dropChunk(c.select), this.dropChunk(c.chunks)));
                    this.dropChunk(menuChunks);
                    this.dropChunk(cursorChunks);
                    await this.__menuChanged();
                },
                async switch(direction) {
                    if (disabled) return;
                    direction = direction.toAxis();
                    const origIndex = this.selIdx;
                    if (this.menu.type !== "action") {
                        this.selIdx += direction.x + ((this.menu as any).numColumns ?? 1) * direction.y;
                        this.selIdx = K.clamp(this.selIdx, 0, this.menu.opts.length - 1);
                    }
                    if (origIndex === this.selIdx) {
                        if (opt?.sounds?.error) this.playSoundCb?.(opt.sounds.error);
                    } else if (opt?.sounds?.switch) this.playSoundCb?.(opt.sounds.switch);
                    await this.__updateSelected();
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
                                mm = mm.opts.find(m => m.id === part)!;
                                break;
                            default:
                                throw "bad";
                        }
                    }
                    if (mm.type === "select") {
                        return mm.multiple ? mm.selected.map(i => (mm as any).opts[i].value) : mm.opts[mm.selected]!.value;
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
