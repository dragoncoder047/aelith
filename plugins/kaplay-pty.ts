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
    readonly disabled: boolean
    backStack: PtyMenu[] // stuff to go back to
    readonly topMenu: PtyMenu
    menu: PtyMenu
    selIdx: number
    selStyle: string
    cmdStyle: string
    ptrText: string
    playSoundCb(sound: string): void
    __updateSelected(): Promise<void>
    __backAll(): void
    __redraw(): Promise<void>
    __submenuRedraw(outChunks: PtyChunk[]): void
    __selectorRedraw(outChunks: PtyChunk[]): void
    __rangeRedraw(outChunks: PtyChunk[]): void
}

// MARK: PtyMenu
export type PtyMenu = {
    name?: string
    id: string,
    styles?: string[],
    hidden?: boolean
} & ({
    type: "submenu"
    opts: PtyMenu[]
} | ({
    type: "action"
    action(): PromiseLike<void>,
} & Object) | {
    type: "select"
    opts: { text: Typable, value: any, hidden?: boolean }[]
    multiple: true
    selected: number[]
} | {
    type: "select"
    opts: { text: Typable, value: any, hidden?: boolean }[]
    multiple?: false
    selected: number
} | {
    type: "range"
    range: [number, number]
    displayRange: [number, number]
    value: number
} | {
    type: "string"
    value: string
    validator: RegExp
    invalidMsg: string
});

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
export interface KAPLAYPtyPlugin {
    pty(opt: PtyCompOpt): PtyComp
    ptyMenu(menu: PtyMenu, opt?: PtyMenuCompOpt): PtyMenuComp
    getValueFromMenu(mm: PtyMenu, path?: string): any | any[] | undefined
}

export function kaplayPTY(K: KAPLAYCtx & KAPLAYDynamicTextPlugin): KAPLAYPtyPlugin {
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
                    if (this.has("offscreen")) this.unuse("offscreen");
                    desiredPos = this.pos;
                    if (this.maxLines !== undefined && this.has("anchor") && ["topleft", "topright"].indexOf((this as any).anchor) !== -1)
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
            var menuChunks: { select: PtyChunk, chunks: PtyChunk[] }[] = [];
            var rangeChunks: { numstr: PtyChunk, bar: PtyChunk } | undefined = undefined;
            var cursorChunks: PtyChunk[] = [];
            var commandChunks: PtyChunk[] = [];

            return {
                id: "pty-menu",
                require: ["pty"],
                backStack: [],
                get topMenu() { return menu; },
                menu: menu,
                selIdx: 0,
                selStyle: "selected",
                cmdStyle: "command",
                ptrText: "\u001a",
                playSoundCb: opt.playSoundCb ?? K.play,
                get disabled() { return disabled; },
                __backAll(this: GameObj<PtyMenuComp | PtyComp>) {
                    this.chunks = this.chunks.slice(0, beginLen);
                    this.menu = menu;
                    this.selIdx = 0;
                    this.backStack = [];
                    this.dropChunk(cursorChunks);
                    optionChunks = [];
                    menuChunks = [];
                    cursorChunks = [];
                    rangeChunks = undefined;
                    disabled = true;
                },
                async __redraw(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (disabled) return;
                    this.chunks = this.chunks.slice(0, beginLen);
                    commandChunks = this.backStack.concat(this.menu).map(c => ({ text: c.id + " ", styles: [...(c.styles ? c.styles : []), this.cmdStyle] }) as PtyChunk);
                    const outChunks: PtyChunk[] = [];
                    cursorChunks = this.toChunks(this.cursor);
                    menuChunks = [];
                    optionChunks = [];
                    rangeChunks = undefined;

                    switch (this.menu.type) {
                        case "submenu":
                            this.dropChunk(cursorChunks);
                            this.__submenuRedraw(outChunks);
                            break;
                        case "select":
                            this.__selectorRedraw(outChunks);
                            break;
                        case "range":
                            this.__rangeRedraw(outChunks);
                            break;
                        case "string":
                            throw "TODO: not implemented";
                        case "action":
                            break;
                        default:
                            throw new Error("Unknown menu type " + (this.menu as any).type);
                    }
                    await this.__updateSelected();
                    await this.command(commandChunks.concat(cursorChunks), outChunks);
                },
                __submenuRedraw(this: GameObj<PtyMenuComp | PtyComp>, outChunks: PtyChunk[]) {
                    if (this.menu.type !== "submenu") throw new Error("unreachable");
                    for (var i = 0; i < this.menu.opts.length; i++) {
                        const opt = this.menu.opts[i]!;
                        const s = { text: "" };
                        const c = { text: opt.hidden ? "" : (opt.name ?? opt.id), styles: opt.styles };
                        outChunks.push(s, c);
                        menuChunks.push({ select: s, chunks: [c] });
                        if (!opt.hidden) outChunks.push({ text: "\n" });
                    }
                },
                __selectorRedraw(this: GameObj<PtyMenuComp | PtyComp>, outChunks: PtyChunk[]) {
                    if (this.menu.type !== "select") throw new Error("unreachable");
                    for (var i = 0; i < this.menu.opts.length; i++) {
                        const opt = this.menu.opts[i]!;
                        const si = { text: "" };
                        const c = [{ text: " " }, ...this.toChunks(opt.text), { text: "\n" }];
                        if (opt.hidden) c.length = 0;
                        outChunks.push(si, ...c);
                        optionChunks.push({ select: si, chunks: c });
                    }
                },
                __rangeRedraw(this: GameObj<PtyComp | PtyMenuComp | TextComp>, outChunks) {
                    if (this.menu.type !== "range") throw new Error("unreachable");
                    const numChunk = { text: "", styles: this.menu.styles };
                    const barChunk = { text: "", styles: this.menu.styles };
                    outChunks.push(
                        { text: `${this.menu.name ?? this.menu.id}\n`, styles: this.menu.styles },
                        numChunk,
                        { text: " " },
                        barChunk);
                    rangeChunks = { numstr: numChunk, bar: barChunk };
                },
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
                    if (this.menu.type === "submenu" || this.menu.type === "select") {
                        this.selIdx = K.clamp(
                            this.selIdx,
                            this.menu.opts.findIndex(x => !x.hidden),
                            this.menu.opts.findLastIndex(x => !x.hidden));
                    }
                    disabled = false;
                    beginLen = this.chunks.length;
                    // save for quitMenu() later
                    menu = this.menu;
                    await this.__redraw();
                },
                // MARK: quitMenu()
                async quitMenu(this: GameObj<PtyMenuComp | PtyComp>) {
                    this.__backAll();
                    await this.command(commandChunks, "");
                    commandChunks = [];
                },
                // MARK: __updateSelected()
                async __updateSelected(this: GameObj<PtyMenuComp | PtyComp | TextComp>) {
                    if (disabled) return;
                    switch (this.menu.type) {
                        case "submenu":
                            for (var i = 0; i < this.menu.opts.length; i++) {
                                const { select: siChunk, chunks: textChunks } = menuChunks[i]!;
                                siChunk.text = this.menu.opts[i]!.hidden ? "" : (this.selIdx === i ? this.ptrText : " ".repeat(this.ptrText.length)) + " ";
                                this.styleChunk(siChunk, this.selStyle, i === this.selIdx);
                                textChunks.forEach(c => this.styleChunk(c, this.selStyle, this.selIdx === i));
                            }
                            break;
                        case "select":
                            for (var i = 0; i < this.menu.opts.length; i++) {
                                const { select: siChunk, chunks: textChunks } = optionChunks[i]!;
                                this.styleChunk(siChunk, this.selStyle, i === this.selIdx);
                                var st = i === this.selIdx ? this.ptrText : " ".repeat(this.ptrText.length);
                                if (this.menu.opts[i]!.hidden) {
                                    st = "";
                                } else if (this.menu.multiple) {
                                    st += `[${this.menu.selected.includes(i) ? "*" : " "}]`;
                                } else {
                                    st += `(${this.menu.selected === i ? "*" : " "})`;
                                }
                                siChunk.text = st;
                                textChunks.forEach(c => this.styleChunk(c, this.selStyle, st.indexOf("*") !== -1));
                            }
                            break;
                        case "range":
                            if (!rangeChunks) throw new Error("unreachable");
                            const numStr = this.menu.value.toString();
                            // TODO: this only works for monospaced fonts with width==height
                            // but my font is like that so it works ¯\_(ツ)_/¯
                            const width = (this.width / this.textSize) - 4 - numStr.length;
                            const before = Math.floor(K.mapc(this.menu.value, this.menu.displayRange[0], this.menu.displayRange[1], 0, width));
                            const after = Math.ceil(K.mapc(this.menu.value, this.menu.displayRange[0], this.menu.displayRange[1], width, 0));
                            rangeChunks.numstr.text = numStr;
                            rangeChunks.bar.text = `[${"-".repeat(before)}@${"-".repeat(after)}]`;
                            break;
                        case "string":
                            throw "TODO: not implemented";
                        case "action":
                            break;
                        default:
                            throw new Error("Unknown menu type " + (this.menu as any).type);
                    }
                    // null op to force refresh
                    await this.type("");
                    this.chunks.pop();
                },
                // MARK: doit()
                async doit(this: GameObj<PtyMenuComp | PtyComp>) {
                    if (disabled) return;
                    switch (this.menu.type) {
                        case "submenu":
                            if (this.menu.opts.length === 0) {
                                if (opt?.sounds?.error) this.playSoundCb?.(opt.sounds.error);
                                return;
                            }
                            this.backStack.push(this.menu);
                            this.menu = this.menu.opts[this.selIdx]!;
                            await this.__redraw();
                            if (this.menu.type === "action") {
                                this.dropChunk(cursorChunks);
                                await this.menu.action();
                                if (disabled) break;
                                beginLen = this.chunks.length;
                                this.menu = this.backStack.pop()!;
                            } else if (this.menu.type === "submenu" || this.menu.type === "select") {
                                this.selIdx = this.menu.opts.findIndex(x => !x.hidden);
                            }
                            await this.__redraw();
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
                            await this.__updateSelected();
                            break;
                        case "range":
                            // nothing to do with this one
                            break;
                        case "action":
                            throw "unreachable";
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
                    menuChunks.forEach(c => (this.dropChunk(c.select), this.dropChunk(c.chunks)));
                    this.dropChunk(cursorChunks);
                    await this.__redraw();
                },
                // MARK: switch()
                async switch(direction) {
                    if (disabled) return;
                    direction = direction.toAxis();
                    var changed = false;
                    if (this.menu.type === "submenu" || this.menu.type === "select") {
                        const old = this.selIdx;
                        this.selIdx += direction.y + direction.x;
                        // skip over hidden entries
                        while (this.menu.opts[this.selIdx]?.hidden)
                            this.selIdx += direction.x + direction.y;
                        // clamp to valid range of entries
                        this.selIdx = K.clamp(
                            this.selIdx,
                            // account for hidden ones at ends
                            this.menu.opts.findIndex(x => !x.hidden),
                            this.menu.opts.findLastIndex(x => !x.hidden));
                        changed = old !== this.selIdx;
                    }
                    else if (this.menu.type === "range") {
                        const old = this.menu.value;
                        this.menu.value = K.clamp(this.menu.value + direction.x - direction.y, this.menu.range[0], this.menu.range[1]);
                        changed = old !== this.menu.value;
                    }
                    if (!changed) {
                        if (opt?.sounds?.error) this.playSoundCb?.(opt.sounds.error);
                    } else if (opt?.sounds?.switch) this.playSoundCb?.(opt.sounds.switch);
                    await this.__updateSelected();
                },
            }
        },
        getValueFromMenu(mm: PtyMenu, path = "") {
            const parts = path.split(".");
            for (var part of parts) {
                if (!mm) break;
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
            if (!mm) return undefined;
            if (mm.type === "select") {
                return mm.multiple ? mm.selected.map(i => (mm as any).opts[i].value) : mm.opts[mm.selected]!.value;
            } else throw "bad";
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
