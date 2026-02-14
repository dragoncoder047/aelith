import { str } from "../utils/utils";
import { DSL_Error, ErrorNote, LocationTrace } from "./errors";
import { Thing, ThingType, BlockType, SymbolType } from "./thing";
import { Token, TokenType } from "./tokenizer";

export function parseTokens(tokens: Token[]): Thing {
    var pos = 0;
    const nextToken = (beginParen: Token | null): Token => {
        if (pos >= tokens.length) {
            if (beginParen) {
                throw new DSL_Error(`${str(beginParen.c)} was never closed`, beginParen.s);
            }
            const last = tokens.at(-1);
            throw new DSL_Error("unreachable", last?.s);
        }
        return tokens[pos++]!;
    };
    const parseStringNoEscapes = (quoteType: string, start: Token): Thing => {
        var raw = "", source = quoteType;
        for (; ;) {
            const token = nextToken(start);
            source += token.c;
            if (isToken(token, TokenType.paren, quoteType)) break;
            if (isToken(token, TokenType.operator, "\\")) {
                const next = nextToken(start);
                if (isToken(next, TokenType.paren, quoteType)) {
                    raw += quoteType;
                    source += token.c + quoteType;
                    continue;
                }
                pos--;
            }
            raw += token.c;
        }
        return new Thing(ThingType.string, null, [], raw, source, "", start.s);
    };
    const parseStringEscapesAndInterpolations = (quoteType: string, start: Token): Thing => {
        const pieces: Thing[] = [];
        var currentString = "", currentStringSrc = "";
        const chuck = () => {
            console.log("chuck");
            const z = new Thing(ThingType.string, null, [], currentString, currentStringSrc, "", start.s);
            pieces.push(z);
            currentString = currentStringSrc = "";
            return z;
        }
        for (; ;) {
            const token = nextToken(start);
            if (isToken(token, TokenType.paren, quoteType)) break;
            if (isToken(token, TokenType.operator, "\\")) {
                const next = nextToken(start);
                if (isToken(next, TokenType.paren, quoteType)) {
                    currentString += quoteType;
                    currentStringSrc += token.c + quoteType;
                } else if (next.t === TokenType.name) {
                    const escPortion = unescape(next.c, next.s, false);
                    if (escPortion.length === 0) {
                        const openCurly = nextToken(start);
                        if (!isToken(openCurly, TokenType.paren, "{")) {
                            throw new DSL_Error(`expected \"{\" after \"\\${next.c}\"`, openCurly.s, [new ErrorNote("note: use ' instead of \" to make this a raw string", start.s)]);
                        }
                        const block = parseBlock("}", BlockType.string, openCurly, false, false), escStr = block.fs;
                        const fullEscape = next.c + escStr;
                        currentStringSrc += token.c + fullEscape;
                        currentString += unescape(fullEscape, block.l, true);
                    } else {
                        currentStringSrc += token.c + next.c;
                        currentString += escPortion;
                    }
                } else {
                    throw new DSL_Error("invalid escape", next.s);
                }
            } else if (isToken(token, TokenType.paren, "{")) {
                chuck();
                pieces.push(parseBlock("}", BlockType.round, token, true, false));
            } else {
                currentString += token.c;
                currentStringSrc += token.c;
            }
        }
        if (pieces.length === 0) {
            return new Thing(ThingType.string, null, [], currentString, quoteType + currentStringSrc, quoteType, start.s);
        } else {
            chuck();
            return new Thing(ThingType.block, BlockType.string, pieces, null, quoteType, quoteType, start.s);
        }
    }
    const parseString = (quoteType: string, start: Token): Thing => {
        if (quoteType === "'") return parseStringNoEscapes(quoteType, start);
        return parseStringEscapesAndInterpolations(quoteType, start);
    };
    const parseBlock = (ending: string | false, type: BlockType, beginning: Token, allowSubBlocks: boolean, first: boolean): Thing => {
        const items: Thing[] = [];
        const thing = new Thing(ThingType.block, type, items, null, first ? "" : beginning.c, ending || "", beginning.s);
        for (; ;) {
            const item = nextToken(beginning);
            if (!ending && item.t === TokenType.eof) break;
            if (item.t !== TokenType.paren) {
                items.push(atomToken(item));
                continue;
            }
            const matching = getClosing(item);
            if (matching && allowSubBlocks) {
                items.push(matching === item.c ? parseString(matching, item) : parseBlock(matching, getBlockType(item), item, true, false));
            } else if (ending) {
                if (ending === item.c) break;
                if (!allowSubBlocks) {
                    items.push(atomToken(item));
                } else {
                    throw new DSL_Error(`expected ${str(ending)}`, item.s, [new ErrorNote(`note: to match this ${str(beginning!.c)}`, beginning!.s)]);
                }
            } else {
                throw new DSL_Error(`stray close paren ${str(ending)}`, item.s);
            }
        }
        return thing;
    };
    return parseBlock(false, BlockType.toplevel, tokens[0]!, true, true);
}

function getClosing(token: Token): string | undefined {
    return {
        "(": ")",
        "[": "]",
        "{": "}",
        "'": "'",
        '"': '"',
    }[token.c]!;
}

function getBlockType(token: Token): BlockType {
    return {
        "(": BlockType.round,
        "[": BlockType.square,
        "{": BlockType.curly,
        "'": BlockType.string,
        '"': BlockType.string
    }[token.c]!;
}

function atomToken(token: Token): Thing {
    switch (token.t) {
        case TokenType.name: return new Thing(ThingType.symbol, SymbolType.nameLike, [], token.c, token.c, "", token.s);
        case TokenType.number: return new Thing(ThingType.number, null, [], Number(token.c), token.c, "", token.s);
        case TokenType.paren:
        case TokenType.operator: return new Thing(ThingType.symbol, SymbolType.operatorLike, [], token.c, token.c, "", token.s);
        case TokenType.whitespace:
        case TokenType.newline:
        case TokenType.eof: return new Thing(ThingType.symbol, SymbolType.whitespaceLike, [], token.c, token.c, "", token.s);
    }
}

function isToken(token: Token, type: TokenType, src: string): boolean {
    return token.t === type && token.c === src;
}

// string string string
function unescape(string: string, src: LocationTrace, variable: boolean): string {
    if (variable) {
        if (!/^u\{[a-f0-9]+\}$/i.test(string)) {
            throw new DSL_Error("invalid escape sequence", src);
        }
        return hexEsc(string, src);
    } else if (/^u$/i.test(string)) {
        return "";
    }
    const escapeLen = {
        a: 1, b: 1, e: 1, f: 1, n: 1, r: 1, t: 1, v: 1, z: 1, '"': 1, "'": 1, "\\": 1,
        x: 3, u: 5, U: 5
    }[string[0]!];
    if (escapeLen === undefined) {
        throw new DSL_Error("unknown escaped character", src);
    }
    const afterPortion = string.slice(escapeLen);
    string = string.slice(0, escapeLen);
    if (string.length < escapeLen || !/^.[a-f0-9]*$/i.test(string)) {
        throw new DSL_Error("invalid escape sequence", src);
    }
    return ({
        a: "\a", b: "\b", e: "\e", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v", z: "\0", "'": "'", "\"": "\"", "\\": "\\",
        x: false as const,
        u: false as const
    }[string.toLowerCase()[0]!] || hexEsc(string, src)) + afterPortion;
}

function hexEsc(string: string, src: LocationTrace): string {
    try {
        return String.fromCodePoint(parseInt(/[0-9a-f]+/i.exec(string)![0], 16));
    } catch (e: any) {
        if (e instanceof RangeError) {
            const e2 = new DSL_Error("escape out of range", src);
            e2.cause = e;
            throw e2;
        }
    }
    throw new DSL_Error("unreachable", src);
}
