import { Asset } from "kaplay";
import { K } from "./context";
import { NestedStrings } from "./context/plugins/kaplay-dynamic-text";
import { AssetData } from "./DataPackFormat";
import * as DownloadManager from "./DownloadManager";
import * as MusicManager from "./music/MusicManager";
import { JSONObject } from "./JSON";

declare global {
    interface Uint8ArrayConstructor {
        fromBase64(b64: string): Uint8Array;
    }
}

async function binSrc(base64OrURL: string, rootURL: URL): Promise<ArrayBuffer> {
    try {
        return Uint8Array.fromBase64(base64OrURL).buffer as ArrayBuffer;
    } catch (e) {
        return (await DownloadManager.loadBytes(resolveURL(base64OrURL, rootURL))).buffer;
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

var totalAssets = 0;
var loadedAssets = 0;

function logLoad<T>(asset: Asset<T>): Asset<T> {
    asset.then(() => loadedAssets++);
    totalAssets++;
    return asset;
}

export function getTotalAssets() {
    return totalAssets;
}

export function getLoadedAssets() {
    return loadedAssets;
}

function resolveURL(assetURL: string, rootJSONURL: URL): URL {
    return new URL(assetURL, rootJSONURL);
}

export async function loadAsset(asset: AssetData, root: URL): Promise<unknown> {
    var kindOK = false;
    switch (asset.kind) {
        case "font": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return logLoad(K.loadFont(asset.id, resolveURL(asset.src as string, root).href));
                case "bin":
                    return logLoad(K.loadFont(asset.id, await binSrc(asset.src as string, root)));
            }
            break;
        case "shader": kindOK = true;
            switch (asset.loader) {
                case undefined:
                case null:
                    // @ts-expect-error
                    return logLoad(K.loadLitShader(asset.id, asset.src.vert, asset.src.frag));
            }
            break;
        case "song": kindOK = true;
            const m = asset.metadata as { title: string, author: string, tags: string[] };
            const theSong = { id: asset.id, title: m.title, author: m.author, tags: m.tags };
            switch (asset.loader) {
                case "url":
                    MusicManager.addSong(theSong)
                    return K.loadMusic(asset.id, resolveURL(asset.src as string, root).href);
                case "bin":
                    MusicManager.addSong(theSong)
                    return logLoad(K.loadSound(asset.id, await binSrc(asset.src as string, root)));
                case "zzfxm":
                    // XXX: commented out for now because the web workers hog so much CPU
                    // K.onLoad(async () => {
                    //     await K.loadZzFXM(asset.id, zzParse(asset.src as string));
                    //     MusicManager.addSong(theSong);
                    //     console.log("lazy loaded the song", theSong.id);
                    // });
                    throw new Error("zzfxm is disabled atm sorry");
            }
            break;
        case "sound": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return logLoad(K.loadSound(asset.id, resolveURL(asset.src as string, root).href));
                case "bin":
                    return logLoad(K.loadSound(asset.id, await binSrc(asset.src as string, root)));
                case "zzfx":
                    return logLoad(K.loadZzFX(asset.id, zzParse(asset.src as string)));
            }
            break;
        case "sprite": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return logLoad(K.loadSprite(asset.id, Array.isArray(asset.src) ? asset.src.map((s: any) => resolveURL(s, root).href) : resolveURL(asset.src as string, root).href, asset.metadata as any));
            }
            break;
        case "spritemap": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return logLoad(K.loadSpriteAtlas(resolveURL(asset.src as string, root).href, typeof asset.metadata === "string" ? resolveURL(asset.metadata, root).href : asset.metadata as any));
            }
            break;
        case "spritefont": kindOK = true;
            switch (asset.loader) {
                case undefined:
                case null:
                    return logLoad(K.loadBitmapFontFromSprite(asset.id, asset.src as string));
            }
            break;
        case "favicon": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return changeFavicon(resolveURL(asset.src as string, root).href);
            }
            break;
        case "translation": kindOK = true;
            switch (asset.loader) {
                case "url":
                    return (asset.metadata as JSONObject | undefined)?.immediate ? K.loadJSON(asset.id, resolveURL(asset.src as string, root).href).then(d => K.strings[asset.id] = d) : K.addLanguageURL(asset.id, resolveURL(asset.src as string, root).href);
                case null:
                case undefined:
                    return K.strings[asset.id] = asset.src as NestedStrings;
            }
    }
    throw new Error(`asset ${asset.id}: ${kindOK ? `unknown loader ${JSON.stringify(asset.loader)} for kind ${asset.kind}` : `unknown asset kind ${JSON.stringify(asset.kind)}`}`);
}
