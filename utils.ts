
export function processTextReplacements(text: string, vars: Record<string, string>): string {
    for (var key of Object.getOwnPropertyNames(vars)) {
        text = text.replaceAll(`{{${key}}}`, vars[key]!);
    }
    return text;
}
