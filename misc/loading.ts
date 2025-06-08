import { AssetBucket } from "kaplay";
import { K } from "../init";
import { MARGIN } from "../constants";

type Assets = typeof K._k.assets;
type KeysWhere<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];

const keys: KeysWhere<Assets, AssetBucket<any>>[] = [
    "sprites",
    "sounds",
    "shaders",
    "fonts",
    "bitmapFonts",
    "custom",
];

var loadFrameCount = 0;
const spinner = "/-\\|";

K.onLoading(() => {
    K.drawRect({
        width: K.width(),
        height: K.height(),
        color: K.BLACK,
    });
    var lines = [];
    var total = 0;
    var loaded = 0;
    for (var k of keys) {
        const res = makeProgressLine(K._k.assets[k], k);
        lines.push(res.str);
        total += res.len;
        loaded += res.loaded;
    }
    const text = `Loading ${(loaded * 100 / total).toFixed(0)}%...\n${lines.join("\n")}`;
    K.drawFormattedText(K.formatText({
        pos: K.vec2(MARGIN),
        text,
        color: K.WHITE,
        size: 8,
        styles: {
            ok: {
                color: K.GREEN
            }
        }
    }));
});

function makeProgressLine(b: AssetBucket<any>, name: (typeof keys)[number]) {
    const prog = b.progress();
    const len = b.assets.size;
    const amt = prog === 1 ? "[ok]DONE[/ok]" : `${Math.round(prog * len)} / ${len}`;
    return { str: `${nameKey(name)}: ${amt}`, len, loaded: prog * len };
}

function nameKey(name: (typeof keys)[number]): string {
    switch (name) {
        case "bitmapFonts":
            return "bitmap fonts";
        case "sprites":
            return "sprites";
        case "sounds":
            return "audio";
        case "custom":
            return "level maps";
        case "fonts":
            return "fonts";
        case "shaders":
            return "WebGL shaders";
    }
}