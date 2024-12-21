import { readFileSync } from "node:fs";

const LANGS = ["en", "es", "de", "ja"];

function get_json(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

const LANG_ENTRIES = {};

for (var lang of LANGS) {
    LANG_ENTRIES[lang] = get_json(`./assets/translations/${lang}.json`);
}

const PATHS_ALL = new Set;
const PATHS_BY_LANG = {}

function recursive_all(vars, byLang) {
    const recur = (curPath, obj) => {
        if (typeof obj === "string") {
            PATHS_ALL.add(curPath.join("."));
            byLang.add(curPath.join("."));
        }
        else if (typeof obj === "object") {
            for (var next of Object.getOwnPropertyNames(obj)) {
                recur(curPath.concat(next), obj[next]);
            }
        }
    };
    recur([], vars);
}

for (var lang of LANGS) {
    PATHS_BY_LANG[lang] = new Set;
    recursive_all(LANG_ENTRIES[lang], PATHS_BY_LANG[lang]);
}

for (var lang of LANGS) {
    console.log(`${lang}:`);
    var good = true;
    for (var path of PATHS_ALL) {
        if (!PATHS_BY_LANG[lang].has(path)) {
            console.error(`  Missing translation ${path}`);
            good = false;
        }
    }
    if (good) {
        console.log("  All good");
    }
}
