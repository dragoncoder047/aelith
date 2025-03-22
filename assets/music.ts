import { AudioPlay, AudioPlayOpt } from "kaplay";
import { K } from "../init";
import { allSongs } from "./audio/songs";

const SONGS = Object.keys(allSongs);

export function playMusic(options: AudioPlayOpt) {
    options.loop = false; // can't have that, it loops automatically
    var currentPlayer: AudioPlay;
    function playNext() {
        currentPlayer?.stop();
        currentPlayer = K.play(K.choose(SONGS), options);
        currentPlayer.onEnd(playNext);
    }
    K.onLoad(playNext);
    return {
        get paused() {
            return currentPlayer?.paused;
        },
        set paused(x) {
            if (currentPlayer)
                currentPlayer.paused = x;
        },
    };
}
