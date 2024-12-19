import { Asset, Comp, GameObj, KAPLAYCtx, TextComp } from "kaplay";

export type NestedStrings = {
    [i: string]:
    | NestedStrings
    | string
    | ((inside: string) => string)
};

export interface DynamicTextComp extends Comp {
    t: string
    data: NestedStrings
}

export interface KAPLAYDynamicTextPlugin {
    strings: NestedStrings,
    langs: NavigatorLanguage["languages"]
    sub(s: string, vars?: NestedStrings): string
    addStrings(s: NestedStrings): Asset<NestedStrings>
    setLanguages(langs: KAPLAYDynamicTextPlugin["langs"]): void
    dynamicText(t?: string): DynamicTextComp
}

export function kaplayDynamicStrings(K: KAPLAYCtx): KAPLAYDynamicTextPlugin {
    return {
        strings: {},
        langs: ["en"],
        sub(s, vars) {
            return subStrings(s, {
                // @ts-expect-error
                ...K.strings,
                inputType: K.getLastInputDeviceType() === "gamepad"
                    ? "gamepad"
                    : "keyboard",
                // @ts-expect-error
                lang: findPreferredLanguage(K.langs),
                ...vars
            });
        },
        addStrings(strings) {
            // @ts-expect-error
            Object.assign(K.strings, strings);
            return new K.Asset(Promise.resolve(strings));
        },
        setLanguages(langs) {
            // @ts-expect-error
            K.langs = langs;
        },
        dynamicText(t = ""): DynamicTextComp {
            return {
                id: "dynamic-text",
                require: ["text"],
                t,
                data: {},
                update(this: GameObj<TextComp | DynamicTextComp>) {
                    // @ts-expect-error
                    this.text = K.sub(this.t, this.data);
                },
                inspect() {
                    return "sub: " + this.t;
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
    const anyfun = Object.getOwnPropertyNames(functions).join("|");
    const funcRegex = anyfun ? new RegExp(`\\$(${anyfun})\\(((?:(?!\\$(?:${anyfun})).)*?)\\)`, "g") : undefined;
    do {
        for (var key of Object.getOwnPropertyNames(flatStrings)) {
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
                    text = text.replace(new RegExp(`\\$${fun}\\(${inside}\\)`, "g"), functions[fun!]!(inside!));
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
        if (typeof obj === "string") {
            flatStrings[curPath.join(".")] = obj;
        }
        else if (typeof obj === "function") {
            functions[curPath.join(".")] = obj;
        }
        else if (typeof obj === "object") {
            for (var next of Object.getOwnPropertyNames(obj)) {
                recur(curPath.concat(next), obj[next]!);
            }
        } else {
            throw new Error("bad type to flatten()");
        }
    };
    recur([], vars);
    return { flatStrings, functions };
}
