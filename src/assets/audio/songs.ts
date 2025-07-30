import { ZzFXMSong } from "../../plugins/kaplay-zzfxm";
import rawSongs from "./songs.yaml";
import { parse } from "./sounds";

export const allSongs: Record<string, ZzFXMSong> = Object.fromEntries(
    (rawSongs as any[]).map(s => [s.title, parse(s.data)]));
