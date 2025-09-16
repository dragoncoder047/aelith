// @ts-nocheck
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

type Instrument = Parameters<typeof ZZFX.buildSamples>;

export type ZzFXMSong = Parameters<typeof zzfxM>;

// @ts-ignore
// ZzFXM (v2.0.3) | (C) Keith Clark | MIT | https://github.com/keithclark/ZzFXM
// modified for Typescript and "ZZFX" import

export async function zzfxM(instruments: Instrument[], patterns: Track[][], sequence: number[], BPM = 125, _metadata?: Metadata): Promise<[number[], number[]]> {
    let instrumentParameters: Instrument;
    let i: number;
    let j: number;
    let k: number;
    let note: number;
    let sample: number;
    let patternChannel: Track;
    let notFirstBeat: boolean;
    let stop: boolean;
    let instrument: Instrument;
    let pitch: number;
    let attenuation: number;
    let outSampleOffset: number;
    let isSequenceEnd: boolean;
    let sampleOffset = 0;
    let nextSampleOffset: number;
    let sampleBuffer: number[] = [];
    let leftChannelBuffer: number[] = [];
    let rightChannelBuffer: number[] = [];
    let channelIndex = 0;
    let panning = 0;
    let hasMore: boolean = true;
    let sampleCache: Record<string, number[]> = {};
    let beatLength = ZZFX.sampleRate / BPM * 60 >> 2;
    let sequenceIndex: number;
    let patternIndex: number;

    // for each channel in order until there are no more
    for (; hasMore; channelIndex++) {

        // reset current values
        sampleBuffer = [pitch = outSampleOffset = hasMore = notFirstBeat = 0];

        // for each pattern in sequence
        for (sequenceIndex = 0; sequenceIndex < sequence.length; sequenceIndex++) {
            // get pattern for current channel, use empty 1 note pattern if none found
            patternChannel = patterns[patternIndex = sequence[sequenceIndex]][channelIndex] || [0, 0, 0] as Track;

            // check if there are more channels
            hasMore |= !!patterns[patternIndex][channelIndex];

            // get next offset, use the length of first channel
            nextSampleOffset = outSampleOffset + (patterns[patternIndex]![0]!.length - 2 - !notFirstBeat) * beatLength;
            // for each beat in pattern, plus one extra if end of sequence
            isSequenceEnd = sequenceIndex == sequence.length - 1;
            for (i = 2, k = outSampleOffset; i < patternChannel.length + isSequenceEnd; notFirstBeat = ++i) {

                // await to make this not freeze on long songs
                await Promise.resolve();

                // <channel-note>
                note = patternChannel[i];

                // stop if end, different instrument or new note
                stop = i == patternChannel.length + isSequenceEnd - 1 && isSequenceEnd ||
                    instrument != (patternChannel[0] || 0) | note | 0;

                // fill buffer with samples for previous beat, most cpu intensive part
                for (j = 0; j < beatLength && notFirstBeat;

                    // fade off attenuation at end of beat if stopping note, prevents clicking
                    j++ > beatLength - 99 && stop ? attenuation += (attenuation < 1) / 99 : 0
                ) {
                    // copy sample to stereo buffers with panning
                    sample = (1 - attenuation) * sampleBuffer[sampleOffset++] / 2 || 0;
                    leftChannelBuffer[k] = (leftChannelBuffer[k] || 0) - sample * panning + sample;
                    rightChannelBuffer[k] = (rightChannelBuffer[k++] || 0) + sample * panning + sample;
                }

                // set up for next note
                if (note) {
                    // set attenuation
                    attenuation = note % 1;
                    panning = patternChannel[1] || 0;
                    if (note |= 0) {
                        // get cached sample
                        sampleBuffer = sampleCache[
                            [
                                instrument = patternChannel[sampleOffset = 0] || 0,
                                note
                            ]
                        ] = sampleCache[[instrument, note]] || (
                            // add sample to cache
                            instrumentParameters = [...instruments[instrument]],
                            // fix for keithclark/ZzFXM#50
                            instrumentParameters[2] ??= 220,
                            instrumentParameters[2] *= 2 ** ((note - 12) / 12),

                            // allow negative values to stop notes
                            note > 0 ? ZZFX.buildSamples(...instrumentParameters) : []
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
