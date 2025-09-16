import { MUSIC_VOLUME } from "../constants";
import { K } from "../init";
import { WorldManager } from "../levels";
import { nextFrame } from "../misc/utils";
import { loadNormals } from "../normalmapgen/normal";
import { allSongs } from "./audio/songs";
import { sounds } from "./audio/sounds";
import unsciiMCRFontDataURL from "./fonts/unscii-8-mcr.woff";
import unsciiFontDataURL from "./fonts/unscii-16.woff";
import allLevels from "./level_maps/*.txt";
import { playMusic } from "./music";
import rumbleEffects from "./rumbleEffects.yaml";
import datapipeShader from "./shaders/dataPipe.glsl";
import fuzzyFadeShader from "./shaders/fuzzy.glsl";
import glitchShader from "./shaders/glitch.glsl";
import invertShader from "./shaders/invert.glsl";
import portalShader from "./shaders/portal.glsl";
import recolorRedShader from "./shaders/recolorRed.glsl";
import stripedoorShader from "./shaders/stripedoor.glsl";
import lightingOnlyShader from "./shaders/bgLight.glsl";
import inputsDataURL from "./textures/inputs.png";
import inputsFontsDef from "./textures/inputs.yaml";
import spritemapDataURL from "./textures/spritemap.png";
import spritemapDef from "./textures/spritemap.yaml";
// import deStrings from "./translations/de.yaml";
import enStrings from "./translations/en.yaml";
import esStrings from "./translations/es.yaml";
import strings from "./translations/index.yaml";
// import jaStrings from "./translations/ja.yaml";


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
        const def = allLevels[name]!;
        WorldManager.loadLevel(name, def, K._k.globalOpt.debug ? -1 : 0);
        resolvers.pop()!();
        await nextFrame();
    }
});
["steel", "ladder", "broken_ladder", "grating", "conveyor", "fan", "door", "antivirus", "bug", "button", "door_half", "box", "player_body", "crossover", "player_head"].forEach(s => loadNormals(s));
K.loadSpriteAtlas(inputsDataURL, inputsFontsDef);
const GP_FONT_CHARS = "d1234vNEWSlrLRetJKXxYyjk"; // cSpell: ignore yyjk
K.loadBitmapFontFromSprite("font_xbox", GP_FONT_CHARS);
K.loadBitmapFontFromSprite("font_switch", GP_FONT_CHARS);
K.loadBitmapFontFromSprite("font_ps4", GP_FONT_CHARS);
K.loadBitmapFontFromSprite("font_ps5", GP_FONT_CHARS);
K.loadBitmapFontFromSprite("keyfont", "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789wasd");
K.loadBitmapFontFromSprite("keyfont2", "tn^eb");
K.loadBitmapFontFromSprite("keyfont3", "s");
K.loadBitmapFontFromSprite("mousefont", "mlrs"); // cSpell: ignore mlrs
K.loadRumbleEffects(rumbleEffects);
K.loadZzFXMultiJSON(sounds);
K.addStrings(strings);
K.setLanguages(["en", "es"/*, "de", "ja"*/]);
K.strings.en = enStrings;
K.strings.es = esStrings;
// K.strings.de = deStrings;
// K.strings.ja = jaStrings;
K.loadFont("Unscii", unsciiFontDataURL);
K.loadFont("Unscii MCR", unsciiMCRFontDataURL);
K.loadShader("recolorRed", null, recolorRedShader);
K.loadLitShader("bg", null, lightingOnlyShader);
K.loadShader("invert", null, invertShader);
K.loadShader("portal", null, portalShader);
K.loadShader("dataPipe", null, datapipeShader);
K.loadShader("fuzzy", null, fuzzyFadeShader);
K.loadShader("glitch", null, glitchShader);
K.loadShader("stripedoor", null, stripedoorShader);
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
