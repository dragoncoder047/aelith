import { map } from "lib0/object";
import { all } from "lib0/promise";
import { JSONValue } from "../utils/JSON";

export const FILE_KEY = "@";

interface FileRef {
    [FILE_KEY]: string;
}

/**
 * Updates the data to expand file references, which are of the form `{"@": "./path/to/other.json"}`.
 * Mutates in-place.
 *
 * @param data The data value to expand references in.
 * @param key The name of the key that makes the value a file reference.
 * @param currentURL The URL representing the data location.
 * @returns the data, if top-level changed.
 */
export async function expandFileReferences<T extends JSONValue>(data: T | FileRef, currentURL: URL, download: (url: URL, obj: any) => Promise<JSONValue>): Promise<T> {
    await expandReferencesInner(data, currentURL, download, x => data = x as T, new Map);
    return data as T;
}

async function expandReferencesInner(data: any, currentURL: URL, download: (url: URL, obj: any) => Promise<any>, set: (newData: any) => void, cache: Map<string, any>) {
    if (typeof data === "object" && data !== null) {
        if (FILE_KEY in data) {
            const relativePath = data[FILE_KEY];
            if (typeof relativePath !== "string") {
                throw new Error("Invalid URL: " + relativePath);
            }
            const newURL = new URL(relativePath, currentURL);
            const absPath = newURL.href;
            if (cache.has(absPath)) {
                set(cache.get(absPath)!);
                return;
            }
            const result = await download(newURL, data);
            cache.set(absPath, result);
            set(result);
            await expandReferencesInner(result, newURL, download, x => { set(x); cache.set(absPath, x) }, cache);
        } else {
            await all(map(data, (v, i) => expandReferencesInner(v, currentURL, download, x => data[i] = x, cache)));
        }
    }
}
