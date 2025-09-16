import { K } from "./context"

const spinner = ["-", "\\\\", "|", "/"]; // need 2 \'s because formatted text
const spinSpeed = 100; // ms per frame
var spinOrigin = 0;
const tagline = "downloading assets..."
var bytesDownloaded = 0, bytesToDownload = 0;

export const LoadingManager = {
    installLoadingScreen() {
        spinOrigin = performance.now();
        K.onLoading(() => this.drawLoadingScreen());
    },
    drawLoadingScreen() {
        const width = K.width() * 3 / 4;
        const left = K.center().sub(width / 2, 0);
        const right = K.center().add(width / 2, 0);
        const progRight = K.lerp(left, right, bytesDownloaded / bytesToDownload);
        const barsize = 16;
        const baroutline = 8;
        const spinI = (((performance.now() - spinOrigin) / spinSpeed) | 0) % spinner.length;
        // clear screen
        K.drawRect({
            color: K.BLACK,
            pos: K.Vec2.ZERO,
            width: K.width(),
            height: K.height(),
        });
        // bar
        K.drawLines({
            pts: [left, right],
            color: K.WHITE,
            width: barsize + baroutline,
            cap: "round"
        });
        K.drawLines({
            pts: [left, right],
            color: K.BLACK,
            width: barsize,
            cap: "round"
        });
        K.drawLines({
            pts: [left, progRight],
            color: K.GREEN,
            width: barsize,
            cap: "round"
        });
        // text and stuff
        K.drawText({
            text: `${tagline}${spinner[spinI]}\n${niceBytes(bytesDownloaded)}/${niceBytes(bytesToDownload)}`,
            anchor: "bot",
            align: "center",
            font: "monospace",
            size: barsize * 3 / 4,
            pos: K.center().sub(0, barsize + baroutline + baroutline),
        });
    },
    loadJSON(path: string, complete: (value: any) => void) {
        K.load((async () => {
            const response = await fetch(path);
            const len = +(response.headers.get("Content-Length") ?? 0)
            bytesToDownload += len;
            const chunks = [];
            const reader = response.body!.getReader();
            for (;;) {
                const c = await reader.read();
                if (c.done) break;
                chunks.push(c.value)
                bytesDownloaded += c.value.length;
            }
            const bytes = new Uint8Array(len);
            var pos = 0;
            for (var chunk of chunks) {
                bytes.set(chunk, pos);
                pos += chunk.length;
            }
            complete(JSON.parse(new TextDecoder("utf-8").decode(bytes)));
        })());
    }
};

function niceBytes(count: number): string {
    const prefixes = ["", "Ki", "Mi", "Gi", "Ti"]; // if we go off the end... wtf is the game doing.
    var i = 0;
    while (count > 1024) count /= 1024, i++;
    return (i > 0 ? count.toFixed(1) : count) + prefixes[i]! + "B";
}
