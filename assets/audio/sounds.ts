import { ZzFXSound } from "../../plugins/kaplay-zzfx";
import rawSounds from "./sounds.yaml";

export const sounds: Record<string, ZzFXSound> = {};

var k: keyof typeof rawSounds;
for (k in rawSounds) {
    sounds[k] = parse(rawSounds[k] as any);
}

export function parse(str: string) {
    str = str.replace(/\[,/g, '[null,')
        .replace(/,,\]/g, ',null]')
        .replace(/,\s*(?=[,\]])/g, ',null')
        .replace(/([\[,]-?)(?=\.)/g, '$10')
        .replace(/-\./g, '-0.');

    return JSON.parse(str, (_, value) => {
        if (value === null) {
            return undefined;
        }
        return value;
    });
}
