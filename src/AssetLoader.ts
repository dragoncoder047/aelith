import { K } from "./context";
import { NestedStrings } from "./context/plugins/kaplay-dynamic-text";
import { AssetData } from "./DataPackFormat";
import * as DownloadManager from "./DownloadManager";

declare global {
    interface Uint8ArrayConstructor {
        fromBase64(b64: string): Uint8Array;
    }
}

function binSrc(asset: AssetData): ArrayBuffer {
    return Uint8Array.fromBase64(asset.src as string).buffer as ArrayBuffer;
}

function zzParse(str: string) {
    str = str.replace(/\[,/g, '[null,')
        .replace(/,,\]/g, ',null]')
        .replace(/,\s*(?=[,\]])/g, ',null')
        .replace(/([\[,]-?)(?=\.)/g, '$10')
        .replace(/-\./g, '-0.');

    return JSON.parse(str, (_, value) => {
        if (value === null) {
            return undefined;
        }
        return value;
    });
}

export function loadAsset(asset: AssetData): unknown {
    var kindOK = false;
    switch (asset.kind) {
        case "font": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return K.loadFont(asset.id, asset.src as string);
                case "bin":
                    return K.loadFont(asset.id, binSrc(asset));
            }
            break;
        case "shader": kindOK = true;
            switch (asset.loader) {
                case "url":
                    // @ts-expect-error
                    return K.loadShaderURL(asset.id, asset.src.vert, asset.src.frag);
                case undefined:
                case null:
                    // @ts-expect-error
                    return K.loadShader(asset.id, asset.src.vert, asset.src.frag);
            }
            break;
        case "song": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return K.loadSound(asset.id, asset.src as string);
                case "bin":
                    return K.loadSound(asset.id, binSrc(asset));
                case "zzfxm":
                    return K.loadZzFXM(asset.id, zzParse(asset.src as string));
            }
            break;
        case "sound": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return K.loadSound(asset.id, asset.src as string);
                case "bin":
                    return K.loadSound(asset.id, binSrc(asset));
                case "zzfx":
                    return K.loadZzFX(asset.id, zzParse(asset.src as string));
            }
            break;
        case "sprite": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return K.loadSprite(asset.id, asset.src as string | string[]);
            }
            break;
        case "spritemap": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return K.loadSpriteAtlas(asset.src as string, asset.metadata as any);
            }
            break;
        case "spritefont": kindOK = true;
            switch (asset.loader) {
                case undefined:
                case null:
                    return K.loadBitmapFontFromSprite(asset.id, asset.src as string);
            }
            break;
        case "translation": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return DownloadManager.loadJSON(asset.src as string, lang => {
                        K.strings[asset.id] = lang;
                    });
                case null:
                case undefined:
                    return K.strings[asset.id] = asset.src as NestedStrings;
            }
    }
    throw new Error(kindOK ? `unknown loader ${JSON.stringify(asset.loader)} for kind ${asset.kind}` : `unknown asset kind ${JSON.stringify(asset.kind)}`);
}
