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

function subStrings(text: string, vars: NestedStrings): string {
    const flattenedVars = flatten(vars);
    do {
        var changed = false;
        for (var key of Object.getOwnPropertyNames(flattenedVars)) {
            const rep = `&${key}`;
            if (text.indexOf(rep) !== -1) {
                // @ts-expect-error
                text = text.replaceAll(rep, flattenedVars[key]!);
                changed = true;
            }
        }
    } while (changed);
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

export interface KAPLAYDynamicStringsPlugin {
    strings: NestedStrings
    sub(s: string, vars?: NestedStrings): string
    loadStrings(s: NestedStrings): Asset<NestedStrings>
    dynamicText(t?: string): DynamicTextComp
}

export function kaplayDynamicStrings(K: KAPLAYCtx): KAPLAYDynamicStringsPlugin {
    return {
        strings: {},
        sub(s, vars) {
            // @ts-expect-error
            return subStrings(s, { ...K.strings, ...vars });
        },
        loadStrings(strings) {
            // @ts-expect-error
            K.strings = strings;
            return new K.Asset(Promise.resolve(strings));
        },
        dynamicText(t = "undefined"): DynamicTextComp {
            return {
                id: "dynamic-text",
                require: ["text"],
                t,
                data: {},
                update(this: GameObj<TextComp | DynamicTextComp>) {
                    // @ts-expect-error
                    this.text = K.sub(this.t, {
                        ...this.data,
                        inputType:
                            K.getLastInputDeviceType() === "gamepad"
                                ? "gamepad"
                                : "keyboard"
                    });
                },
                inspect() {
                    return "sub: " + this.t;
                }
            }
        }
    }
};
