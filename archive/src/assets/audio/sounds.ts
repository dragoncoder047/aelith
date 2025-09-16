import { ZzFXSound } from "../../plugins/kaplay-zzfx";
import rawSounds from "./sounds.yaml";

export const sounds: Record<string, ZzFXSound> = {};

for (var k in rawSounds) {
    sounds[k] = parse(rawSounds[k]);
}
