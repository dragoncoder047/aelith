import { str } from "../utils/utils";
import { DSL_Error, LocationTrace } from "./errors";

export enum TokenType {
    name,
    number,
    paren,
    operator,
    whitespace,
    newline,
    eof,
}

export class Token {
    constructor(
        /** token contents */
        public readonly c: string,
        /** source */
        public readonly s: LocationTrace,
        /** kind */
        public readonly t: TokenType) { }
}

type Rule = [
    RegExp,
    outputToken: TokenType,
];
const TOKENIZE_RULES: Rule[] = [
    [/^0x[a-f0-9]+|^-?0b[01]+/i, TokenType.number],
    [/^(\.\d+|\d+\.?\d*)(e[+-]?\d+)?/i, TokenType.number],
    [/^[()[\]{}"']/, TokenType.paren],
    [/^\p{Punctuation}/u, TokenType.operator],
    [/^\p{Alpha}[\p{Alpha}\p{Number}_]*/u, TokenType.name],
    [/^[\s]+/, TokenType.whitespace],
    [/^\n/, TokenType.newline],
    [/^./, TokenType.operator]
];

export function tokenize(source: string, filename: URL) {
    var line = 0, col = 0;
    const out: Token[] = [];
    tokens: while (source.length > 0) {
        for (var [regex, type] of TOKENIZE_RULES) {
            const match = regex.exec(source);
            if (match) {
                const chunk = match[0];
                if (type !== undefined) out.push(new Token(chunk, new LocationTrace(line, col, filename), type));
                const interlines = chunk.split("\n");
                if (interlines.length > 1) {
                    col = interlines.at(-1)!.length;
                    line += interlines.length - 1;
                } else {
                    col += chunk.length;
                }
                source = source.slice(chunk.length);
                continue tokens;
            }
        }
        throw new DSL_Error(`unexpected ${str(source[0])}`, new LocationTrace(line, col, filename));
    }
    out.push(new Token("", new LocationTrace(line, col, filename), TokenType.eof));
    return out;
}
