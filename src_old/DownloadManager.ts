import { K } from "../src/context";
import * as AssetLoader from "./AssetLoader";

const spinner = ["-", "\\\\", "|", "/"]; // need 2 \'s because formatted text
const spinSpeed = 100; // ms per frame
var spinOrigin = 0;
const tagline_json = "downloading game data...";
const tagline_assets = "downloading assets...";
var bytesDownloaded = 0, bytesToDownload = 0;
var eta = "\ncalculating time...";

export function installLoadingScreen() {
    spinOrigin = performance.now();
    K.onLoading(drawLoadingScreen);
}

/** history in bytes/ms */
const downloadHistory: number[] = [];
function etaEntry(bytes: number, time: number) {
    downloadHistory.push(bytes / time);
    if (downloadHistory.length > 10) downloadHistory.shift();
    const avgBytesPerMs = downloadHistory.reduce((a, b) => a + b, 0) / downloadHistory.length;
    const speed = `${niceBytes(avgBytesPerMs * 1000)}/s`;
    const timeLeft = niceTime((bytesToDownload - bytesDownloaded) / avgBytesPerMs / 1000);
    eta = `${speed}\neta ${timeLeft}`;
}

var isDownloadingJSON = true;
export function doneWithInitialJSON() {
    isDownloadingJSON = false;
    eta = "";
}

function drawLoadingScreen() {
    const width = K.width() * 3 / 4;
    const left = K.center().sub(width / 2, 0);
    const right = K.center().add(width / 2, 0);
    const format = (x: number, y: number, fmt: (x: number) => string) => [x / y, fmt(x), fmt(y)] as const;
    const [progress, data1, data2] = isDownloadingJSON ? format(bytesDownloaded, bytesToDownload, niceBytes) : format(AssetLoader.getLoadedAssets(), AssetLoader.getTotalAssets(), x => "" + x);
    const progRight = K.lerp(left, right, progress);
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
        text: `${isDownloadingJSON ? tagline_json : tagline_assets}${spinner[spinI]}\n${data1}/${data2} ${eta}`,
        anchor: "bot",
        align: "center",
        font: "monospace",
        size: barsize * 3 / 4,
        pos: K.center().sub(0, barsize + baroutline + baroutline),
    });
}
export function loadBytes(path: URL) {
    return K.load((async () => {
        const response = await fetch(path);
        const len = +(response.headers.get("Content-Length") ?? 0);
        bytesToDownload += len;
        const bytes = new Uint8Array(len);
        const reader = response.body!.getReader();
        var now = performance.now();
        var pos = 0;
        for (; ;) {
            const c = await reader.read();
            if (c.done) break;
            const chunk = c.value;
            bytes.set(chunk, pos);
            const chunkLength = c.value.length ?? c.value.byteLength;
            bytesDownloaded += chunkLength;
            pos += chunkLength;
            const next = performance.now();
            etaEntry(chunkLength, next - now);
            now = next;
        }
        // why are 2 necessary??
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        return bytes;
    })());
}
export async function loadJSON(path: URL) {
    return JSON.parse(new TextDecoder("utf-8").decode(await loadBytes(path)));
}

function niceBytes(count: number): string {
    if (!isFinite(count)) return "very fast";
    const prefixes = ["", "Ki", "Mi", "Gi", "Ti"]; // if we go off the end... wtf is the game doing.
    var i = 0;
    while (count > 1024) count /= 1024, i++;
    return (i > 0 ? count.toFixed(1) : count) + prefixes[i]! + "B";
}

function niceTime(t: number): string {
    if (t > 3600) return ((t / 3600) | 0) + "h " + niceTime(t % 3600);
    if (t > 60) return ((t / 60) | 0) + "m " + niceTime(t % 60);
    return t.toFixed(3) + "s";
}
