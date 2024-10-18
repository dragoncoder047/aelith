import { Asset, KAPLAYCtx } from "kaplay";
import { ZZFX } from "zzfx";

//@ts-ignore
//! ZzFXM (v2.0.3) | (C) Keith Clark | MIT | https://github.com/keithclark/ZzFXM
//! modified for Typescript and "ZZFX" import
const zzfxM = (n: ZzFXMSong[0], f: ZzFXMSong[1], t: ZzFXMSong[2], e = 125): [number[], number[]] => { let l, o, z, r, g, h, x, a, u, c, d, i, m, p, G, M = 0, R = [], b = [], j = [], k = 0, q = 0, s = 1, v = {}, w = ZZFX.sampleRate / e * 60 >> 2; for (; s; k++)R = [s = a = d = m = 0], t.map((e, d) => { for (x = f[e][k] || [0, 0, 0], s |= !!f[e][k], G = m + (f[e][0].length - 2 - !a) * w, p = d == t.length - 1, o = 2, r = m; o < x.length + p; a = ++o) { for (g = x[o], u = o == x.length + p - 1 && p || c != (x[0] || 0) | g | 0, z = 0; z < w && a; z++ > w - 99 && u ? i += (i < 1) / 99 : 0)h = (1 - i) * R[M++] / 2 || 0, b[r] = (b[r] || 0) - h * q + h, j[r] = (j[r++] || 0) + h * q + h; g && (i = g % 1, q = x[1] || 0, (g |= 0) && (R = v[[c = x[M = 0] || 0, g]] = v[[c, g]] || (l = [...n[c]], l[2] *= 2 ** ((g - 12) / 12), g > 0 ? ZZFX.buildSamples(...l) : []))) } m = G }); return [b, j] }

type ZzFXMMetadata = {
    title: string,
    author?: string,
    authorUrl?: string,
    license?: string,
    instruments?: string[],
    patterns?: string[],
    notes?: string,
};

interface ZzFXMTrack {
    0: number | undefined, // which instrument
    1: number | undefined, // panning
    [notes: number]: number | undefined
}

export interface ZzFXMSong {
    0: Parameters<typeof ZZFX.buildSamples>[],
    1: ZzFXMTrack[][],
    2: number[], // sequence
    3?: number, // bpm
    4?: ZzFXMMetadata,
}

export interface ZzFXMPlugin {
    loadZzFXM(name: string, data: ZzFXMSong): Asset<ZzFXMSong>,
}

export function kaplayZzFXM(K: KAPLAYCtx): ZzFXMPlugin {
    return {
        loadZzFXM(name, parameters) {
            return K.load((async () => {
                // @ts-expect-error
                const [l, r] = zzfxM(...parameters);
                const buf = K.audioCtx.createBuffer(2, l.length, ZZFX.sampleRate);
                buf.getChannelData(0).set(l, 0);
                buf.getChannelData(1).set(r, 0);
                await K.loadSound(name, buf);
                return parameters;
            })());
        },
    }
}
