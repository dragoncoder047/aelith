import { afterEach, beforeEach, expect, test } from "bun:test";
import { expandFileReferences, FILE_KEY } from "../src/load";

var DUMMY_FS: Record<string, any>
beforeEach(() => {
    DUMMY_FS = {
        "/foo": {
            a: 123,
        },
        "/bar": {
            b: "hello",
            c: { [FILE_KEY]: "/foo" }
        },
        "/baz": [1, 2, 3, { [FILE_KEY]: "/bar" }],
        "/recur1": [0, { [FILE_KEY]: "/recur2" }],
        "/recur2": [0, { [FILE_KEY]: "/recur1" }],
        "/null": null,
    }
});
const fetches: string[] = [];
const DUMMY_DOWNLOAD = (url: URL) => {
    fetches.push(url.pathname);
    return Promise.resolve(DUMMY_FS[url.pathname]);
}
afterEach(() => fetches.length = 0);

const obj: any = [0, [0, {}]];
obj[1][1] = obj;

test.each([
    ["one level", { "@": "/foo" }, { a: 123 }, ["/foo"]],
    ["two levels", { "@": "/bar" }, { b: "hello", c: { a: 123 } }, ["/bar", "/foo"]],
    ["three levels/arrays", { "@": "/baz" }, [1, 2, 3, { b: "hello", c: { a: 123 } }], ["/baz", "/bar", "/foo"]],
    ["dependency loop", { "@": "/recur1" }, obj, ["/recur1", "/recur2"]],
    ["null", { "@": "/null" }, null, ["/null"]],
])("%s", async (_name, unexpanded: any, expanded: any, pathsFetched: string[]) => {
    expect(await expandFileReferences(unexpanded, new URL("/", "about://blank"), DUMMY_DOWNLOAD)).toEqual(expanded);
    expect(fetches).toEqual(pathsFetched);
});
