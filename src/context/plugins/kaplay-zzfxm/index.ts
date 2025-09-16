import type { Asset, KAPLAYCtx } from "kaplay";
import { ZZFX } from "zzfx";
import { zzfxM, ZzFXMSong } from "./zzfxm";

export interface ZzFXMPlugin {
    loadZzFXM(name: string, data: ZzFXMSong): Asset<ZzFXMSong>,
}

export function kaplayZzFXM(K: KAPLAYCtx): ZzFXMPlugin {
    return {
        loadZzFXM(name, parameters) {
            return K.load((async () => {
                const [l, r] = await zzfxM(...parameters);
                const buf = K.audioCtx.createBuffer(2, l.length, ZZFX.sampleRate);
                buf.getChannelData(0).set(l, 0);
                buf.getChannelData(1).set(r, 0);
                await K.loadSound(name, buf);
                return parameters;
            })());
        },
    }
}
