import { describe, test } from "bun:test";
import { BlockType, SymbolType, ThingType } from "../src/scripting/thing";
import { expectParse, expectParseError, makespec } from "./astCheck";

describe("basics", () => {
    test("top-level block", () => {
        expectParse("",
            makespec(ThingType.block, BlockType.toplevel));
    });
    test("symbol", () => {
        expectParse("hello",
            makespec(ThingType.block, BlockType.toplevel, null,
                makespec(ThingType.symbol, SymbolType.nameLike, "hello")));
    });
    test("raw string", () => {
        expectParse("'hello'",
            makespec(ThingType.block, BlockType.toplevel, null,
                makespec(ThingType.string, null, "hello")));
    });
    test("string", () => {
        expectParse('"hello"',
            makespec(ThingType.block, BlockType.toplevel, null,
                makespec(ThingType.string, null, "hello")));
    });
    describe("numbers", () => {
        test("float", () => {
            expectParse("123.45",
                makespec(ThingType.block, BlockType.toplevel, null,
                    makespec(ThingType.number, null, 123.45)));
        });
        test("scientific", () => {
            expectParse("123.45e67",
                makespec(ThingType.block, BlockType.toplevel, null,
                    makespec(ThingType.number, null, 123.45e67)));
        });
        test("int", () => {
            expectParse("123",
                makespec(ThingType.block, BlockType.toplevel, null,
                    makespec(ThingType.number, null, 123)));
        });
        test("hex", () => {
            expectParse("0x123",
                makespec(ThingType.block, BlockType.toplevel, null,
                    makespec(ThingType.number, null, 0x123)));
        });
        test("bin", () => {
            expectParse("0b111",
                makespec(ThingType.block, BlockType.toplevel, null,
                    makespec(ThingType.number, null, 0b111)));
        });
    });
});
describe("strings", () => {
    test("parses raw string and ignores escapes except for single 's", () => {
        expectParse("'hello\\u0001'",
            makespec(ThingType.block, BlockType.toplevel, null,
                makespec(ThingType.string, null, "hello\\u0001")));
        expectParse("'hello\\u{a234'",
            makespec(ThingType.block, BlockType.toplevel, null,
                makespec(ThingType.string, null, "hello\\u{a234")));
        expectParse("'hello\\''",
            makespec(ThingType.block, BlockType.toplevel, null,
                makespec(ThingType.string, null, "hello'")));
    });
    test("parses normal string and processes escapes", () => {
        expectParse("\"hello\\u0001\"",
            makespec(ThingType.block, BlockType.toplevel, null,
                makespec(ThingType.string, null, "hello\u0001")));
        expectParseError("\"\\u{1234567890}\"", "escape out of range");
        expectParseError("\"\\u{\"", "\"{\" was never closed");
    });
});
describe("symbols", () => {
    test("operators and words", () => {
        expectParse("a+b",
            makespec(ThingType.block, BlockType.toplevel, null,
                makespec(ThingType.symbol, SymbolType.nameLike, "a"),
                makespec(ThingType.symbol, SymbolType.operatorLike, "+"),
                makespec(ThingType.symbol, SymbolType.nameLike, "b")));
    });
    test("operators don't get merged", () => {
        expectParse("a+=&b",
            makespec(ThingType.block, BlockType.toplevel, null,
                makespec(ThingType.symbol, SymbolType.nameLike, "a"),
                makespec(ThingType.symbol, SymbolType.operatorLike, "+"),
                makespec(ThingType.symbol, SymbolType.operatorLike, "="),
                makespec(ThingType.symbol, SymbolType.operatorLike, "&"),
                makespec(ThingType.symbol, SymbolType.nameLike, "b")));
    });
    test("whitespace counts as a symbol", () => {
        expectParse("  ",
            makespec(ThingType.block, BlockType.toplevel, null,
                makespec(ThingType.symbol, SymbolType.whitespaceLike, "  ")));
    });
});
