import { K } from "./context";
import { NestedStrings } from "./context/plugins/kaplay-dynamic-text";
import { AssetData } from "./DataPackFormat";
import * as DownloadManager from "./DownloadManager";
import * as MusicManager from "./music/MusicManager";

declare global {
    interface Uint8ArrayConstructor {
        fromBase64(b64: string): Uint8Array;
    }
}

async function binSrc(asset: { src: any }): Promise<ArrayBuffer> {
    try {
        return Uint8Array.fromBase64(asset.src as string).buffer as ArrayBuffer;
    } catch (e) {
        return (await DownloadManager.loadBytes(asset.src)).buffer;
    }
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

function changeFavicon(url: string) {
    var link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
    }
    link.href = url;
}

export async function loadAsset(asset: AssetData) {
    var kindOK = false;
    switch (asset.kind) {
        case "font": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return K.loadFont(asset.id, asset.src as string);
                case "bin":
                    return K.loadFont(asset.id, await binSrc(asset));
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
            const m = asset.metadata as { title: string, author: string, tags: string[] };
            MusicManager.addSong({ id: asset.id, title: m.title, author: m.author, tags: m.tags })
            switch (asset.loader) {
                case "url":
                    return K.loadSound(asset.id, asset.src as string);
                case "bin":
                    return K.loadSound(asset.id, await binSrc(asset));
                case "zzfxm":
                    return K.loadZzFXM(asset.id, zzParse(asset.src as string));
            }
            break;
        case "sound": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return K.loadSound(asset.id, asset.src as string);
                case "bin":
                    return K.loadSound(asset.id, await binSrc(asset));
                case "zzfx":
                    return K.loadZzFX(asset.id, zzParse(asset.src as string));
            }
            break;
        case "sprite": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return K.loadSprite(asset.id, asset.src as string | string[], asset.metadata as any);
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
        case "favicon": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return changeFavicon(asset.src as string);
            }
            break;
        case "translation": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return await DownloadManager.loadJSON(asset.src as string).then(lang => {
                        K.strings[asset.id] = lang;
                    });
                case null:
                case undefined:
                    return K.strings[asset.id] = asset.src as NestedStrings;
            }
    }
    throw new Error(`asset ${asset.id}: ${kindOK ? `unknown loader ${JSON.stringify(asset.loader)} for kind ${asset.kind}` : `unknown asset kind ${JSON.stringify(asset.kind)}`}`);
}
