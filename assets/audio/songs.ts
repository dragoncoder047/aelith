import { ZzFXMSong } from "../../plugins/kaplay-zzfxm";
import rawSongs from "./songs.json";
import { parse } from "./sounds";

export const allSongs: Record<string, ZzFXMSong> = Object.fromEntries(
    rawSongs.map(s => [s.title, parse(s.data)]));
