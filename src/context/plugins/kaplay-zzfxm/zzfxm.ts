import { ZZFX } from "zzfx";

type Metadata = {
    title: string,
    author?: string,
    authorUrl?: string,
    license?: string,
    instruments?: string[],
    patterns?: string[],
    notes?: string,
};

interface Track extends Array<number | undefined> {
    0: number | undefined, // which instrument
    1: number | undefined, // panning
    [notes: number]: number | undefined
}

declare global {
    const zzfxG: typeof ZZFX.buildSamples;
    const zzfxR: number;
}

type Instrument = Parameters<typeof zzfxG>;

export type ZzFXMSong = Parameters<typeof zzfxM>;

// ZzFXM (v2.0.3) | (C) Keith Clark | MIT | https://github.com/keithclark/ZzFXM
// modified for Typescript, "ZZFX" import, and web workers

/// <reference lib="webworker" />

var WORKER_SRC: string, WORKER_BLOB: Blob, WORKER_URL: string;
export async function zzfxM(instruments: Instrument[], patterns: Track[][], sequence: number[], BPM = 125, _metadata?: Metadata): Promise<[Float32Array, Float32Array]> {
    if (!WORKER_SRC) {
        WORKER_SRC = `let z={g:${ZZFX.buildSamples},sampleRate:${ZZFX.sampleRate},volume:${ZZFX.volume}},zzfxG=(...a)=>z.g(...a),zzfxR=z.sampleRate;${zzfxMInner};(${() => {
            const runner = (self as any);
            runner.onmessage = (e: MessageEvent) => {
                const args = e.data as ZzFXMSong;
                const song = zzfxMInner(...args);
                runner.postMessage(song, [song[0].buffer, song[1].buffer]);
                runner.close(); // done!
            }
        }})()`;
        WORKER_BLOB = new Blob([WORKER_SRC], { type: "text/javascript" });
        WORKER_URL = URL.createObjectURL(WORKER_BLOB);
    }
    const myWorker = new Worker(WORKER_URL);
    return new Promise((resolve, reject) => {
        myWorker.onmessage = e => resolve(e.data);
        myWorker.onerror = e => reject(e.error);
        myWorker.postMessage([instruments, patterns, sequence, BPM]);
    });
}

function zzfxMInner(instruments: Instrument[], patterns: Track[][], sequence: number[], BPM = 125, _metadata: any): [Float32Array, Float32Array] {
    let u = (len: number) => new Float32Array(len);
    let instrumentParameters: Instrument;
    let noteIndex: number;
    let beatSampleCounter: number;
    let masterSampleCopyIndex: number = 0;
    let note: number | undefined;
    let sample: number;
    let patternChannel: Track;
    let notFirstBeat: number;
    let stop: number;
    let instrument: number;
    let attenuation: number;
    let outSampleOffset: number;
    let isSequenceEnd: number;
    let sampleOffset = 0;
    let nextSampleOffset: number;
    let sampleBuffer: number[] = [];
    let leftChannelBuffer: Float32Array = u(0);
    let rightChannelBuffer: Float32Array = u(0);
    let copyLeftBuffer: Float32Array;
    let copyRightBuffer: Float32Array;
    let resizeLen: number;
    let channelIndex = 0;
    let panning = 0;
    let hasMore: number = 1;
    let sampleCache: Record<string, number[]> = {};
    let beatLength = zzfxR / BPM * 60 >> 2;
    let sequenceIndex: number;
    let patternIndex: number;

    // for each channel in order until there are no more
    for (; hasMore; channelIndex++) {

        // reset current values
        sampleBuffer = [outSampleOffset = hasMore = notFirstBeat = 0];

        // for each pattern in sequence
        for (sequenceIndex = 0; sequenceIndex < sequence.length; sequenceIndex++) {
            // get pattern for current channel, use empty 1 note pattern if none found
            patternChannel = patterns[patternIndex = sequence[sequenceIndex]!]![channelIndex] || [0, 0, 0] as Track;

            // check if there are more channels
            hasMore |= <any>!!patterns[patternIndex]![channelIndex];

            // get next offset, use the length of first channel
            nextSampleOffset = outSampleOffset + (patterns[patternIndex]![0]!.length - 2 - <any>!notFirstBeat) * beatLength;
            // for each beat in pattern, plus one extra if end of sequence
            isSequenceEnd = <any>(sequenceIndex == sequence.length - 1);
            for (noteIndex = 2, masterSampleCopyIndex = outSampleOffset; noteIndex < patternChannel.length + <any>isSequenceEnd; notFirstBeat = <any>++noteIndex) {

                // <channel-note>
                note = patternChannel[noteIndex];

                // stop if end, different instrument or new note
                stop = noteIndex == patternChannel.length + isSequenceEnd - 1 && isSequenceEnd ||
                    // @ts-ignore
                    instrument != (patternChannel[0] || 0) | note | 0;

                // resize buffers if needed; use large reallocate size to avoid tons of reallocation
                // using 8 * beatLength means ~1 second of audio at 48kHz and 120 BPM
                resizeLen = masterSampleCopyIndex + beatLength << 3;
                if (leftChannelBuffer.length < resizeLen) {
                    copyLeftBuffer = u(resizeLen);
                    copyRightBuffer = u(resizeLen);
                    copyLeftBuffer.set(leftChannelBuffer);
                    copyRightBuffer.set(rightChannelBuffer);
                    leftChannelBuffer = copyLeftBuffer;
                    rightChannelBuffer = copyRightBuffer;
                }
                // fill buffer with samples for previous beat, most cpu intensive part
                for (beatSampleCounter = 0; beatSampleCounter < beatLength && notFirstBeat;

                    // fade off attenuation at end of beat if stopping note, prevents clicking
                    // @ts-ignore
                    beatSampleCounter++ > beatLength - 99 && stop ? attenuation += (attenuation < 1) / 99 : 0
                ) {
                    // copy sample to stereo buffers with panning
                    // @ts-ignore
                    sample = (1 - attenuation) * sampleBuffer[sampleOffset++] / 2 || 0;
                    leftChannelBuffer[masterSampleCopyIndex] = leftChannelBuffer[masterSampleCopyIndex]! - sample * panning + sample;
                    rightChannelBuffer[masterSampleCopyIndex] = rightChannelBuffer[masterSampleCopyIndex++]! + sample * panning + sample;
                }

                // set up for next note
                if (note) {
                    // set attenuation
                    attenuation = note % 1;
                    panning = patternChannel[1] || 0;
                    if (note |= 0) {
                        // get cached sample
                        sampleBuffer = sampleCache[
                            <any>[
                                instrument = patternChannel[sampleOffset = 0] || 0,
                                note
                            ]
                        ] = sampleCache[<any>[instrument, note]] || (
                            // add sample to cache
                            instrumentParameters = [...instruments[instrument]!],
                            // fix for keithclark/ZzFXM#50
                            instrumentParameters[2] ??= 220,
                            instrumentParameters[2] *= 2 ** ((note - 12) / 12),

                            // allow negative values to stop notes
                            note > 0 ? zzfxG(...instrumentParameters) : []
                        );
                    }
                }
            }

            // update the sample offset
            outSampleOffset = nextSampleOffset;
        };
    }
    // if real number of samples is less than the number of samples in buffer, truncate zeros
    leftChannelBuffer = new Float32Array(leftChannelBuffer.buffer, 0, masterSampleCopyIndex);
    rightChannelBuffer = new Float32Array(rightChannelBuffer.buffer, 0, masterSampleCopyIndex);

    return [leftChannelBuffer, rightChannelBuffer];
}
