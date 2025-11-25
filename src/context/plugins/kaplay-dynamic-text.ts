import type { Asset, Comp, GameObj, KAPLAYCtx, TextComp } from "kaplay";

export type NestedStrings = {
    [i: string]:
    | NestedStrings
    | string
    | NestedStrings[]
    | ((inside: string) => string)
};

export interface DynamicTextComp extends Comp {
    t: string
    data: NestedStrings
}

export interface KAPLAYDynamicTextPlugin {
    strings: NestedStrings,
    langs: string[],
    preferredLanguage: string | null
    sub(s: string, vars?: NestedStrings): string
    addStrings(s: NestedStrings): Asset<NestedStrings>
    addLanguageURL(lang: string, url: string): void;
    setAvailableLanguages(langs: KAPLAYDynamicTextPlugin["langs"]): void
    useLanguage(lang: string | null): void;
    currentLanguage(): string;
    dynamicText(t?: string): DynamicTextComp
}

export function kaplayDynamicStrings(K: KAPLAYCtx & KAPLAYDynamicTextPlugin): KAPLAYDynamicTextPlugin {
    const _langUrls: Record<string, string[]> = {};
    const _loaded: Record<string, boolean> = {};
    const _lazyLoad = (lang: string) => {
        const urls = _langUrls[lang]!;
        _loaded[lang] = true;
        urls.forEach(url => fetch(url).then(resp => resp.json()).then(json => Object.assign(K.strings[lang] ??= {}, json)));
    }
    return {
        strings: {},
        langs: ["en"],
        preferredLanguage: null,
        sub(s, vars) {
            return subStrings(s, {
                ...K.strings,
                inputType: K.getLastInputDeviceType() === "gamepad"
                    ? "gamepad"
                    : "keyboard",
                lang: K.currentLanguage(),
                ...vars
            });
        },
        addStrings(strings) {
            Object.assign(K.strings, strings);
            return new K.Asset(Promise.resolve(strings));
        },
        addLanguageURL(lang, url) {
            (_langUrls[lang] ??= []).push(url);
            _loaded[lang] = false;
        },
        setAvailableLanguages(langs) {
            K.langs = langs;
        },
        useLanguage(lang) {
            K.preferredLanguage = lang;
        },
        currentLanguage() {
            const lang = K.preferredLanguage ?? findPreferredLanguage(K.langs);
            if (!_loaded[lang]) _lazyLoad(lang);
            return lang;
        },
        dynamicText(t = ""): DynamicTextComp {
            return {
                id: "dynamic-text",
                require: ["text"],
                t,
                data: {},
                update(this: GameObj<TextComp | DynamicTextComp>) {
                    this.text = K.sub(this.t, this.data);
                },
                inspect(this: GameObj<TextComp | DynamicTextComp>) {
                    const esc = (s: string) => s.replaceAll(/(?<!\\)([[\\])/g, "\\$1")
                    return "sub: " + esc(this.t) + "\nres: " + esc(this.text);
                }
            }
        }
    }
};

function matchiness(a: string, b: string) {
    const aa = new Intl.Locale(a);
    const bb = new Intl.Locale(b);
    if (aa.baseName === bb.baseName) return 3;
    if (aa.language === bb.language) return 1;
    return 0;
}

function findPreferredLanguage(availableLangs: NavigatorLanguage["languages"]): NavigatorLanguage["language"] {
    const preferredLangs = navigator?.languages ?? [navigator.language];
    var bestScore = -1;
    var bestLang = "";
    for (var candidate of availableLangs) {
        var score = 0;
        for (var preferred of preferredLangs) {
            score += matchiness(preferred, candidate);
        }
        if (score > bestScore) {
            bestLang = candidate;
            bestScore = score;
        }
    }
    return bestLang;
}

function subStrings(text: string, vars: NestedStrings): string {
    const { flatStrings, functions } = flatten(vars);
    var changed = 0;
    const anyfun = Object.keys(functions).join("|");
    // Sort by length so we're greedy
    const strNames = Object.keys(flatStrings).sort((a, b) => b.length - a.length);
    const anykey = strNames.map(s => s.replaceAll(/\./g, "\\.")).join("|")
    const funcRegex = anyfun ? new RegExp(`\\$(${anyfun})\\(((?:(?!\\$(?:${anyfun}))(?!&(?:${anykey}))[\\s\\S])*?)\\)`, "gm") : undefined;
    do {
        for (var key of strNames) {
            const rep = `&${key}`;
            if (text.indexOf(rep) !== -1) {
                text = text.replaceAll(rep, flatStrings[key]!);
                changed = 2;
            }
        }
        if (funcRegex) {
            const mm = funcRegex.exec(text);
            if (mm) {
                const [_, fun, inside] = mm;
                if (fun! in functions) {
                    text = text.replace(new RegExp(`\\$${fun}\\(${inside}\\)`, "gm"), functions[fun!]!(inside!));
                } else throw new Error("bad");
                changed = 2;
            }
        }
        changed--;
    } while (changed > 0);
    return text;
}

function flatten(vars: NestedStrings) {
    const flatStrings: Record<string, string> = {};
    const functions: Record<string, ((inside: string) => string)> = {};
    const recur = (curPath: string[], obj: NestedStrings[keyof NestedStrings]) => {
        if (Array.isArray(obj)) {
            flatStrings[curPath.join(".") + ".length"] = "" + obj.length;
            for (var i = 0; i < obj.length; i++) {
                recur(curPath.concat("" + i), obj[i]!);
            }
        }
        else if (typeof obj === "string") {
            flatStrings[curPath.join(".")] = obj;
        }
        else if (typeof obj === "function") {
            functions[curPath.join(".")] = obj;
        }
        else if (typeof obj === "object" && obj !== null) {
            for (var next of Object.getOwnPropertyNames(obj)) {
                recur(curPath.concat(next), obj[next]!);
            }
        } else {
            throw new Error(`bad type to flatten(): ${obj} (${curPath})`);
        }
    };
    recur([], vars);
    return { flatStrings, functions };
}
