import { AudioPlay, AudioPlayOpt } from "kaplay";
import { K } from "../init";

const SONGS = ["aaa", "bbb", "ccc"];

export function playMusic(options: AudioPlayOpt) {
    options.loop = false; // can't have that, it loops automatically
    var currentPlayer: AudioPlay;
    function playNext() {
        currentPlayer?.stop();
        currentPlayer = K.play(K.choose(SONGS), options);
        currentPlayer.onEnd(playNext);
    }
    playNext();
    return {
        get paused() {
            return currentPlayer.paused;
        },
        set paused(x) {
            currentPlayer.paused = x;
        },
    };
}
