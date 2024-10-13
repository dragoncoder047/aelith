
type NestedStrings = Record<string, any>;
export function processTextReplacements(text: string, vars: NestedStrings): string {
    const flattenedVars = flatten(vars);
    do {
        var changed = false;
        for (var key of Object.getOwnPropertyNames(flattenedVars)) {
            const rep = `{{${key}}}`;
            if (text.indexOf(rep) !== -1) {
                text = text.replaceAll(rep, flattenedVars[key]!);
                changed = true;
            }
        }
    } while (changed);
    return text;
}

export function flatten(vars: NestedStrings): Record<string, string> {
    const out: Record<string, string> = {};
    const recur = (curPath: string[], obj: NestedStrings | string) => {
        if (typeof obj !== "object") {
            out[curPath.join(".")] = obj;
        }
        else for (var next of Object.getOwnPropertyNames(obj)) {
            recur(curPath.concat(next), obj[next]);
        }
    };
    recur([], vars);
    return out;
}
