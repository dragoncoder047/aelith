import { TextChunkCompressed } from "../transitions";

export function cutsceneParse(script: string): TextChunkCompressed[] {
    const lines = script.split("\n");
    const out: TextChunkCompressed[] = [];
    for (var line of lines) {
        line = line.trim();
        line = line.replaceAll("\\n", "\n");
        const firstChar = line[0];
        line = line.slice(1);
        const bits = line.split(";");
        switch (firstChar) {
            case "$":
                out.push(["command", ...bits]);
                break;
            case ".":
                out.push({
                    value: {
                        text: bits[0]!,
                        typewriter: true,
                        sound: "typing",
                        delayBefore: ensureNumber(bits[1]!),
                    },
                    showCursor: true,
                });
                break;
            case "!":
                out.push({
                    value: {
                        text: bits[0]!,
                        sound: "command_fail",
                        delayBefore: ensureNumber(bits[1]!),
                        styles: ["stderr"],
                    }
                });
                break;
        }
    }

    return out;
}

function ensureNumber(x: string): number {
    return parseFloat(x.trim());
}
