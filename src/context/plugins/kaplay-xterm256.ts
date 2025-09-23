import { Color, ColorArgs, KAPLAYCtx } from "kaplay";

export type XT256ColorArgs = ColorArgs | [`xt${string}`];
export function kaplayXterm256(k: KAPLAYCtx) {
    const oldRGB = k.rgb as any;
    const xtermColors: Color[] = [];
    var x;
    for (x = 0; x < 8; x++) {
        xtermColors[x] = oldRGB(x & 1 ? 0xAA : 0, x & 2 ? 0xAA : 0, x & 4 ? 0xAA : 0);
    }
    for (x = 8; x < 16; x++) {
        xtermColors[x] = oldRGB(x & 1 ? 0xFF : 0x55, x & 2 ? 0xFF : 0x55, x & 4 ? 0xFF : 0x55);
    }
    const cubeLevels = [0x00, 0x66, 0x88, 0xBB, 0xDD, 0xFF];
    for (x = 0; x < 232 - 16; x++) {
        var bx = x % 6;
        var gx = ((x / 6) | 0) % 6;
        var rx = ((x / 36) | 0) % 6;
        xtermColors[x + 16] = oldRGB(cubeLevels[rx]!, cubeLevels[gx]!, cubeLevels[bx]!);
    }
    for (x = 232; x < 256; x++) {
        var gray = 8 + (x - 232) * 10;
        xtermColors[x] = oldRGB(gray, gray, gray)
    }
    return {
        rgb(...args: XT256ColorArgs) {
            if (args.length === 1 && typeof args[0] === "string" && /^xt/.test(args[0]!)) {
                return xtermColors[parseInt(args[0].slice(2))];
            }
            return oldRGB(...args);
        }
    }
}
