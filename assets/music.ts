import { AudioPlay, AudioPlayOpt } from "kaplay";
import { K } from "../init";

const SONGS = ["aaa", "bbb", "ccc"];

export function playMusic(options: AudioPlayOpt): AudioPlay {
    var currentPlayer: AudioPlay;
    function playNext() {
        currentPlayer = K.play(K.choose(SONGS), options);
        currentPlayer.onEnd(playNext);
    }
    playNext();
    return {
        // noe of these are used, it's just to 
        play() { currentPlayer.play() },
        seek(to) { currentPlayer.seek(to) },
        stop() { currentPlayer.stop() },
        get paused() { return currentPlayer.paused },
        set paused(x) { currentPlayer.paused = x },
        get speed() { return currentPlayer.speed },
        set speed(x) { currentPlayer.speed = x },
        get detune() { return currentPlayer.detune },
        set detune(x) { currentPlayer.detune = x },
        get volume() { return currentPlayer.volume },
        set volume(x) { currentPlayer.volume = x },
        get loop() { return currentPlayer.loop },
        set loop(x) { currentPlayer.loop = x },
        time() { return currentPlayer.time() },
        duration() { return currentPlayer.duration() },
        onEnd(x) { return currentPlayer.onEnd(x) },
        then(x) { return currentPlayer.then(x) },
        connect(x) { return currentPlayer.connect(x) },
    };
}
