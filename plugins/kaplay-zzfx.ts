import { Asset, KAPLAYCtx } from "kaplay";
import { ZZFX } from "zzfx";

export type ZzFXSound = Parameters<typeof ZZFX.buildSamples>;

export interface ZzFXPlugin {
    play: KAPLAYCtx["play"]
    loadZzFX(name: string, parameters: ZzFXSound): Asset<ZzFXSound>
}

export function kaplayZzFX(K: KAPLAYCtx): ZzFXPlugin {
    const oldPlay = K.play;
    const zzfxMap = new Map<string, (number | undefined)[]>();
    return {
        play(src, options) {
            if (typeof src === "string" && zzfxMap.has(src)) {
                const samples = ZZFX.buildSamples(...zzfxMap.get(src)!);
                const buffer = K.audioCtx.createBuffer(1, samples.length, ZZFX.sampleRate);
                buffer.getChannelData(0).set(samples, 0);
                return oldPlay(new K.SoundData(buffer), options);
            } else return oldPlay(src, options);
        },
        loadZzFX(name, parameters) {
            zzfxMap.set(name, parameters);
            return new K.Asset(Promise.resolve(parameters));
        },
    }
}
