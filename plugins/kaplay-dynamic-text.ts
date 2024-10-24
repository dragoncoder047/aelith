import { Asset, Comp, GameObj, KAPLAYCtx, TextComp } from "kaplay";

type NestedStrings = {
    [i: string]:
    | NestedStrings
    | string
    | ((substring: string, ...args: any) => string)
};

export interface DynamicTextComp extends Comp {
    t: string
    data: Record<string, string>
}

export interface KAPLAYDynamicTextPlugin {
    strings: NestedStrings,
    langs: NavigatorLanguage["languages"]
    sub(s: string, vars?: NestedStrings): string
    loadStrings(s: NestedStrings): Asset<NestedStrings>
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
        loadStrings(strings) {
            // @ts-expect-error
            K.strings = strings;
            return new K.Asset(Promise.resolve(strings));
        },
        setLanguages(langs) {
            // @ts-expect-error
            K.langs = langs;
        },
        dynamicText(t = "undefined"): DynamicTextComp {
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
    const flattenedVars = flatten(vars);
    var changed = 0;
    do {
        for (var key of Object.getOwnPropertyNames(flattenedVars)) {
            const rep = `&${key}`;
            if (text.indexOf(rep) !== -1) {
                // @ts-expect-error
                text = text.replaceAll(rep, flattenedVars[key]!);
                changed = 2;
            }
        }
        changed--;
    } while (changed > 0);
    return text;
}

function flatten(vars: NestedStrings) {
    const out: Record<string, Exclude<NestedStrings[keyof NestedStrings], NestedStrings>> = {};
    const recur = (curPath: string[], obj: NestedStrings[keyof NestedStrings]) => {
        if (typeof obj !== "object") {
            out[curPath.join(".")] = obj;
        }
        else for (var next of Object.getOwnPropertyNames(obj)) {
            recur(curPath.concat(next), obj[next]!);
        }
    };
    recur([], vars);
    return out;
}
