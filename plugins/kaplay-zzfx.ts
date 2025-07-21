import type { Asset, KAPLAYCtx } from "kaplay";
import { ZZFX } from "zzfx";

export type ZzFXSound = Parameters<typeof ZZFX.buildSamples>;

export interface ZzFXPlugin {
    play: KAPLAYCtx["play"]
    loadZzFX(name: string, parameters: ZzFXSound): Asset<ZzFXSound>,
    loadZzFXMultiJSON(json: Record<string, ZzFXSound>): Asset<ZzFXSound>[]
}

export function kaplayZzFX(K: KAPLAYCtx): ZzFXPlugin {
    const oldPlay = K.play;
    const zzfxMap = new Map<string, (number | undefined)[]>();
    const cache = new Map<string, AudioBuffer>();
    // use the same audio context if the user calls zzfx() directly
    ZZFX.x = K.audioCtx;
    return {
        play(src, options) {
            if (typeof src === "string" && zzfxMap.has(src)) {
                var buffer = cache.get(src);
                // Cache the samples to prevent needing to regenerate the samples every time
                if (!buffer) {
                    const samples = ZZFX.buildSamples(...(zzfxMap.get(src)!.with(1, 0)));
                    buffer = K.audioCtx.createBuffer(1, samples.length, ZZFX.sampleRate);
                    buffer.getChannelData(0).set(samples, 0);
                    cache.set(src, buffer);
                }
                return oldPlay(new K.SoundData(buffer), { ...options, detune: (options?.detune ?? 0) * (1 + (Math.random() - 0.5) * (zzfxMap.get(src)![1] ?? 0.05)) });
            } else return oldPlay(src, options);
        },
        loadZzFX(name, parameters) {
            zzfxMap.set(name, parameters);
            // just for load tracking; the fact that it's trying to install a json as a sound data
            // will never happen as the play intercepts the key here
            return K._k.assets.sounds.addLoaded(name, parameters as any) as any;
        },
        loadZzFXMultiJSON(json) {
            const out: Asset<ZzFXSound>[] = [];
            for (var key of Object.getOwnPropertyNames(json)) {
                // @ts-expect-error
                out.push(K.loadZzFX(key, json[key]));
            }
            return out;
        }
    }
}
