import { expect, test } from "bun:test";
import { LocationTrace } from "../src/scripting/errors";
import { tokenize, Token, TokenType } from "../src/scripting/tokenizer";

const F = new URL("about:test");

const getTokenContents = (a: Token[]) => a.map(t => t.c);
const getTokenTypes = (a: Token[]) => a.map(t => t.t)

test("doesn't make assumptions about comments", () => {
    const x = tokenize("// foo", F);
    const y = tokenize("/* foo */", F);
    expect(getTokenContents(x)).toEqual(["/", "/", " ", "foo", ""]);
    expect(getTokenContents(y)).toEqual(["/", "*", " ", "foo", " ", "*", "/", ""]);
    expect(getTokenTypes(x)).toEqual([TokenType.operator, TokenType.operator, TokenType.whitespace, TokenType.name, TokenType.eof]);
    expect(getTokenTypes(y)).toEqual([TokenType.operator, TokenType.operator, TokenType.whitespace, TokenType.name, TokenType.whitespace, TokenType.operator, TokenType.operator, TokenType.eof]);
});
test("groups name tokens", () => {
    expect(getTokenContents(tokenize("a b coffee", F))).toEqual(["a", " ", "b", " ", "coffee", ""]);
});
test("maintains column and line", () => {
    expect(tokenize("a\nb c", F).map(t => t.s)).toEqual([
        new LocationTrace(0, 0, F),
        new LocationTrace(0, 1, F),
        new LocationTrace(1, 0, F),
        new LocationTrace(1, 1, F),
        new LocationTrace(1, 2, F),
        new LocationTrace(1, 3, F)]);
});
test("parses hex numbers", () => {
    const x = tokenize("0xFFE65A", F);
    expect(x).toBeArrayOfSize(2);
    expect(x[0]).toEqual(new Token("0xFFE65A", new LocationTrace(0, 0, F), TokenType.number));
    expect(x[1]).toEqual(new Token("", new LocationTrace(0, 8, F), TokenType.eof));
});
test("parses binary numbers", () => {
    const x = tokenize("0b00010001", F);
    expect(x).toBeArrayOfSize(2);
    expect(x[0]).toEqual(new Token("0b00010001", new LocationTrace(0, 0, F), TokenType.number));
    expect(x[1]).toEqual(new Token("", new LocationTrace(0, 10, F), TokenType.eof));
});
test("parses float numbers", () => {
    const x = tokenize("123456.789E+56", F);
    expect(x).toBeArrayOfSize(2);
    expect(x[0]).toEqual(new Token("123456.789E+56", new LocationTrace(0, 0, F), TokenType.number));
    expect(x[1]).toEqual(new Token("", new LocationTrace(0, 14, F), TokenType.eof));
});
test("invalid float numbers get broken up", () => {
    const x = tokenize("123456..789E+56", F);
    expect(x).toBeArrayOfSize(3);
    expect(x[0]).toEqual(new Token("123456.", new LocationTrace(0, 0, F), TokenType.number));
    expect(x[1]).toEqual(new Token(".789E+56", new LocationTrace(0, 7, F), TokenType.number));
    expect(x[2]).toEqual(new Token("", new LocationTrace(0, 15, F), TokenType.eof));
});
