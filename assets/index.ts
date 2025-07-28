import { MUSIC_VOLUME } from "../constants";
import { K } from "../init";
import { WorldManager } from "../levels";
import { nextFrame } from "../misc/utils";
import { allSongs } from "./audio/songs";
import { sounds } from "./audio/sounds";
import unsciiMCRFontDataURL from "./fonts/unscii-8-mcr.woff";
import ibmMonoFontDataURL from "./fonts/Web437_IBM_EGA_8x8.woff";
import allLevels from "./level_maps/ALL.json";
import { playMusic } from "./music";
import rumbleEffects from "./rumbleEffects.yaml";
import datapipeShader from "./shaders/dataPipe.glsl";
import fuzzyFadeShader from "./shaders/fuzzy.glsl";
import glitchShader from "./shaders/glitch.glsl";
import invertShader from "./shaders/invert.glsl";
import portalShader from "./shaders/portal.glsl";
import recolorRedShader from "./shaders/recolorRed.glsl";
import stripedoorShader from "./shaders/stripedoor.glsl";
import translateShader from "./shaders/translate.glsl";
import gamepadFontDataURL from "./textures/gamepadfont.png";
import gamepadFontDef from "./textures/gamepadfont.yaml";
import spritemapDataURL from "./textures/spritemap.png";
import spritemapDef from "./textures/spritemap.yaml";
import deStrings from "./translations/de.yaml";
import enStrings from "./translations/en.yaml";
import esStrings from "./translations/es.yaml";
import strings from "./translations/index.yaml";
import jaStrings from "./translations/ja.yaml";


// Load assets
// this is just to dummy up the progress bar animation
const resolvers: (() => void)[] = [];
const allLevelIDs: (keyof typeof allLevels)[] = Object.keys(allLevels) as any;
for (var i = 0; i < allLevelIDs.length; i++)
    K.load((async () => {
        await new Promise<void>(r => resolvers.push(r));
    })());
K.loadSpriteAtlas(spritemapDataURL, spritemapDef).then(async () => {
    // Must wait to load sprites before loading levels
    for (var i = 0; i < allLevelIDs.length; i++) {
        const name = allLevelIDs[i]!;
        const def = allLevels[name];
        WorldManager.loadLevel(name, def, K._k.globalOpt.debug ? -1 : 0);
        resolvers.pop()!();
        await nextFrame();
    }
});
K.loadSpriteAtlas(gamepadFontDataURL, gamepadFontDef);
const GP_FONT_CHARS = "d1234vNEWSlrLRetJKXxYyjk"; // cSpell: ignore yyjk
K.loadBitmapFontFromSprite("font_xbox", GP_FONT_CHARS);
K.loadBitmapFontFromSprite("font_switch", GP_FONT_CHARS);
K.loadBitmapFontFromSprite("font_ps4", GP_FONT_CHARS);
K.loadBitmapFontFromSprite("font_ps5", GP_FONT_CHARS);
K.loadRumbleEffects(rumbleEffects);
K.loadZzFXMultiJSON(sounds);
K.addStrings(strings);
K.setLanguages(["en", "es", "de", "ja"]);
K.strings.en = enStrings;
K.strings.es = esStrings;
K.strings.de = deStrings;
K.strings.ja = jaStrings;
K.loadFont("IBM Mono", ibmMonoFontDataURL);
K.loadFont("Unscii MCR", unsciiMCRFontDataURL);
K.loadShader("recolorRed", undefined, recolorRedShader);
K.loadShader("translate", undefined, translateShader);
K.loadShader("invert", undefined, invertShader);
K.loadShader("portal", undefined, portalShader);
K.loadShader("dataPipe", undefined, datapipeShader);
K.loadShader("fuzzy", undefined, fuzzyFadeShader);
K.loadShader("glitch", undefined, glitchShader);
K.loadShader("stripedoor", undefined, stripedoorShader);
Object.keys(allSongs).forEach(key => K.loadZzFXM(key, allSongs[key]!));

// idk where else to put this
K.strings.fn = {
    switch(switchData) {
        const [key, ...caseStrings] = switchData.split("~");
        const procCases = {} as Record<string, string>;
        for (var caseStr of caseStrings) {
            const [caseKey, caseValue] = caseStr.split(":");
            procCases[caseKey!] = caseValue!;
        }
        return String(procCases[key!]);
    }
};

export const musicPlay = playMusic({
    loop: true,
    volume: MUSIC_VOLUME,
    paused: true,
});
