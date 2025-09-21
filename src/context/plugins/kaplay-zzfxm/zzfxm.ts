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

var WORKER_SRC: string, WORKER_BLOB: Blob, WORKER_URL: string;
export async function zzfxM(instruments: Instrument[], patterns: Track[][], sequence: number[], BPM = 125, _metadata?: Metadata): Promise<[Float32Array, Float32Array]> {
    if (!WORKER_SRC) {
        WORKER_SRC = `let z={g:${ZZFX.buildSamples},sampleRate:${ZZFX.sampleRate},volume:${ZZFX.volume}},zzfxG=(...a)=>z.g(...a),zzfxR=z.sampleRate;${zzfxMInner};(${() => {
            const runner = (self as DedicatedWorkerGlobalScope);
            runner.onmessage = (e: MessageEvent) => {
                const args = e.data as ZzFXMSong;
                const song = zzfxMInner(...args);
                runner.postMessage(song, [song[0].buffer, song[1].buffer]);
            }
        }})()`;
        WORKER_BLOB = new Blob([WORKER_SRC], { type: "text/javascript" });
        WORKER_URL = URL.createObjectURL(WORKER_BLOB);
        console.log(WORKER_SRC);
    }
    const myWorker = new Worker(WORKER_URL);
    return new Promise((resolve, reject) => {
        myWorker.onmessage = e => resolve(e.data);
        myWorker.onerror = e => reject(e.error);
        myWorker.postMessage([instruments, patterns, sequence, BPM]);
    });
}

function zzfxMInner(instruments: Instrument[], patterns: Track[][], sequence: number[], BPM = 125, _metadata: any): [Float32Array, Float32Array] {
    let instrumentParameters: Instrument;
    let i: number;
    let j: number;
    let k: number;
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
    let leftChannelBuffer: Float32Array = new Float32Array;
    let rightChannelBuffer: Float32Array = new Float32Array;
    let copyLeftBuffer: Float32Array;
    let copyRightBuffer: Float32Array;
    let len: number;
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
            for (i = 2, k = outSampleOffset; i < patternChannel.length + <any>isSequenceEnd; notFirstBeat = <any>++i) {

                // <channel-note>
                note = patternChannel[i];

                // stop if end, different instrument or new note
                stop = i == patternChannel.length + isSequenceEnd - 1 && isSequenceEnd ||
                    // @ts-ignore
                    instrument != (patternChannel[0] || 0) | note | 0;

                // resize buffers if needed
                len = k + beatLength * (1 + isSequenceEnd);
                if (leftChannelBuffer.length < len) {
                    copyLeftBuffer = new Float32Array(len);
                    copyRightBuffer = new Float32Array(len);
                    copyLeftBuffer.set(leftChannelBuffer);
                    copyRightBuffer.set(rightChannelBuffer);
                    leftChannelBuffer = copyLeftBuffer;
                    rightChannelBuffer = copyRightBuffer;
                }
                // fill buffer with samples for previous beat, most cpu intensive part
                for (j = 0; j < beatLength && notFirstBeat;

                    // fade off attenuation at end of beat if stopping note, prevents clicking
                    // @ts-ignore
                    j++ > beatLength - 99 && stop ? attenuation += (attenuation < 1) / 99 : 0
                ) {
                    // copy sample to stereo buffers with panning
                    // @ts-ignore
                    sample = (1 - attenuation) * sampleBuffer[sampleOffset++] / 2 || 0;
                    leftChannelBuffer[k] = leftChannelBuffer[k]! - sample * panning + sample;
                    rightChannelBuffer[k] = rightChannelBuffer[k++]! + sample * panning + sample;
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

    return [leftChannelBuffer, rightChannelBuffer];
}
