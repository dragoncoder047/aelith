import { AudioPlay } from "kaplay";
import { SYSTEM_SETTINGS } from "../static/systemMenus";
import { RangeSetting } from "../settings";

interface Song {
    id: string;
    title: string;
    author: string;
    tags: string[];
}

const allSongs = [];

export function addSong(song: Song) {
    allSongs.push(song);
}

// TODO: play and pause songs

var currentSong: AudioPlay | undefined;
export function update() {
    if (currentSong) currentSong.volume = SYSTEM_SETTINGS.getValue<RangeSetting>("musicVolume")!;
}
