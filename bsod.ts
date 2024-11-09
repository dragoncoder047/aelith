import { K } from "./init";

K.onError(error => {
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
        text: K.sub("&msg.gameErrored").replace(/(?<!\\)\[/g, "\\["),
        font: "sans-serif",
        width: K.width() * 2 / 3,
        size: K.height() / 36,
        lineSpacing: 1.15,
        pos: K.vec2(K.width() / 6, K.height() * 5 / 12),
        color: K.WHITE,
        fixed: true
    });
    K.drawText({
        text: K.sub("&msg.gameErrorDetails").replace(/(?<!\\)\[/g, "\\["),
        font: "sans-serif",
        width: K.width() * 2 / 3,
        size: K.height() / 48,
        lineSpacing: 1.15,
        pos: K.vec2(K.width() / 6, K.height() / 2),
        color: K.WHITE,
        fixed: true
    });
    K.drawText({
        text: String(error instanceof Error ? error.stack : error).replace(/(?<!\\)\[/g, "\\["),
        font: "monospace",
        width: K.width() * 2 / 3,
        size: K.height() / 56,
        pos: K.vec2(K.width() / 6, K.height() * 51 / 96),
        color: K.WHITE,
        fixed: true
    });
});
