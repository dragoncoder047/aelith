import { expect } from "bun:test";
import { DSL_Error, ErrorNote } from "../src/scripting/errors";
import { parseTokens } from "../src/scripting/parser1";
import { Thing, ThingType } from "../src/scripting/thing";
import { tokenize } from "../src/scripting/tokenizer";

export const F = new URL("about:test");

type ASTSpec = {
    t: ThingType,
    t2: number | null,
    v?: any,
    c?: readonly ASTSpec[]
}
function checkAST(ast: any, spec: ASTSpec, path: string) {
    for (var prop of Object.keys(spec)) {
        const newpath = path + "." + prop;
        const failMsg = "AST failed to match at " + newpath;
        const desc = spec[prop as keyof ASTSpec]!;
        if (Array.isArray(desc)) {
            expect(ast[prop], failMsg).toBeArrayOfSize(desc.length);
            for (var i = 0; i < desc.length; i++) {
                checkAST(ast[prop][i], desc[i]!, path + "." + prop + "[" + i + "]");
            }
        } else if (typeof desc === "object" && desc !== null) {
            checkAST(ast[prop], desc, newpath);
        } else {
            expect(ast[prop], failMsg).toEqual(desc);
        }
    }
}

export function makespec(type: ThingType, subtype: number | null, value: any | null = null, ...children: readonly ASTSpec[]): ASTSpec {
    const obj: ASTSpec = { t: type, t2: subtype, c: children };
    if (value !== null) obj.v = value;
    return obj;
}

export function expectParse(p: string, spec: ASTSpec) {
    try {
        checkAST(parseTokens(tokenize(p, F)), spec, "");
    } catch (e) {
        if (e instanceof DSL_Error) {
            expect.unreachable(e.displayOn({ [F.href]: p }) + e.stack);
        }
        else throw e;
    }
}

export function expectParseError(p: string, error: string, note?: string) {
    try {
        parseTokens(tokenize(p, F));
        expect.unreachable("Did not throw an error!");
    } catch (e: any) {
        expect(e).toBeInstanceOf(DSL_Error);
        expect(e.message).toEqual(error);
        if (note !== undefined) {
            expect(e.notes.map((n: ErrorNote) => n.message)).toContain(note);
        }
    }
}

// export function expectEval(p: string, spec: ASTSpec) {
//     try {
//         checkAST(TODO parseTokens(tokenize(p, F)), spec, "");
//     } catch (e) {
//         if (e instanceof CrakError) {
//             expect.unreachable(e.displayOn({ [F.href]: p }) + e.stack);
//         }
//         else throw e;
//     }
// }

// export function expectEvalError(p: string, error: string, note?: string) {
//     try {
//         TODO parseTokens(tokenize(p, F));
//         expect.unreachable("Did not throw an error!");
//     } catch (e: any) {
//         expect(e).toBeInstanceOf(CrakError);
//         expect(e.message).toEqual(error);
//         if (note !== undefined) {
//             expect(e.notes.map((n: ErrorNote) => n.message)).toContain(note);
//         }
//     }
// }
