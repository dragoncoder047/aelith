import { K } from "./context";

export function drawBlueScreenOfDeath(errorDetails: string) {
    // Draw blue windows screen of death
    // because windows is garbage and we want to
    // be as garbage as possible ;)
    K.drawRect({
        width: K.width(),
        height: K.height(),
        pos: K.vec2(0),
        color: K.rgb(10, 100, 255),
        fixed: true
    });
    // Sad face
    K.drawText({
        text: ":(",
        font: "sans-serif",
        size: K.height() / 8,
        pos: K.vec2(K.width() / 6, K.height() / 4),
        color: K.WHITE,
        fixed: true
    });
    K.drawText({
        text: K.sub("&msg.bsod.sadfaceMsg").replace(/(?<!\\)\[/g, "\\["),
        font: "sans-serif",
        width: K.width() * 2 / 3,
        size: K.height() / 36,
        lineSpacing: 1.15,
        pos: K.vec2(K.width() / 6, K.height() * 5 / 12),
        color: K.WHITE,
        fixed: true
    });
    K.drawText({
        text: K.sub("&msg.bsod.searchOnlineHint").replace(/(?<!\\)\[/g, "\\["),
        font: "sans-serif",
        width: K.width() * 2 / 3,
        size: K.height() / 48,
        lineSpacing: 1.15,
        pos: K.vec2(K.width() / 6, K.height() / 2),
        color: K.WHITE,
        fixed: true
    });
    K.drawText({
        text: errorDetails,
        font: "monospace",
        width: K.width() * 2 / 3,
        size: K.height() / 56,
        pos: K.vec2(K.width() / 6, K.height() * 51 / 96),
        color: K.WHITE,
        fixed: true
    });
}

export function install() {
    K.onError(error => {
        drawBlueScreenOfDeath(error.stack!.replace(/(?<!\\)([\[\\])/g, "\\$1"));
        if (!((error as any).sourcemapsResolved)) helpSourcemaps(error);
        else {
            K.audioCtx.resume().then(() => K.play("bsod_error"));
        }
    });
}

// async import so we don't download it until we have a use for it
// these libs are only a few tens of KiB so shouldn't be that big of a deal but it's not
// necessary at all for the game
const STACKTRACE_LIB_URL = "https://cdn.jsdelivr.net/npm/stacktrace-js@2.0.2/+esm";
async function helpSourcemaps(error: Error) {
    const StackTrace = (await import(STACKTRACE_LIB_URL)).default as typeof import("stacktrace-js");
    const newTraceback = error.toString() + "\n" + (await StackTrace.fromError(error)).map(frame => {
        var url = /native/i.test(frame.fileName!) ? frame.fileName! : new URL(frame.fileName!).pathname.replace(/^\//, "");
        if (/node_modules/.test(url)) {
            url = url.split("node_modules/").at(-1)!
        } else if (!/native/i.test(url)) {
            url = "./" + url;
        }
        return `    at ${frame.functionName ?? "<unnamed>"} (${url}:${frame.lineNumber}:${frame.columnNumber})`;
    }).join("\n");
    const newError = new Error(error.toString());
    newError.cause = error;
    (newError as any).sourcemapsResolved = true;
    newError.stack = newTraceback;
    // fake it to allow another error screen to be drawn
    K._k.game.crashed = false;
    K.throwError(newError as any);
}

