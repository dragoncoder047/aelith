declare module "zzfx" {
    export const ZZFX: {
        volume: number
        sampleRate: number
        x: AudioContext
        play(...parameters: (number | undefined)[]): AudioBufferSourceNode
        playSamples(...samples: number[]): AudioBufferSourceNode
        buildSamples(
            volume?: number,
            randomness?: number,
            frequency?: number,
            attack?: number,
            sustain?: number,
            release?: number,
            shape?: number,
            shapeCurve?: number,
            slide?: number,
            deltaSlide?: number,
            pitchJump?: number,
            pitchJumpTime?: number,
            repeatTime?: number,
            noise?: number,
            modulation?: number,
            bitCrush?: number,
            delay?: number,
            sustainVolume?: number,
            decay?: number,
            tremolo?: number,
            filter?: number
        ): number[]
        getNote(semitoneOffset?: number, rootNoteFrequency?: number): number
    };
}