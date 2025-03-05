import { MUSIC_VOLUME } from "../constants";
import { K } from "../init";
import { aaa, bbb, ccc } from "./audio/songs";
import { sounds } from "./audio/sounds";
import unsciiMCRFontDataURL from "./fonts/unscii-8-mcr.woff";
import ibmMonoFontDataURL from "./fonts/Web437_IBM_EGA_8x8.woff";
import { playMusic } from "./music";
import rumbleEffects from "./rumbleEffects.json";
import datapipeShader from "./shaders/dataPipe.glsl";
import fuzzyFadeShader from "./shaders/fuzzy.glsl";
import invertShader from "./shaders/invert.glsl";
import portalShader from "./shaders/portal.glsl";
import recolorRedShader from "./shaders/recolorRed.glsl";
import translateShader from "./shaders/translate.glsl";
import spritemapDef from "./textures/spritemap.json" with { type: "json" };
import spritemapDataURL from "./textures/spritemap.png";
import deStrings from "./translations/de.json" with { type: "json" };
import enStrings from "./translations/en.json" with { type: "json" };
import esStrings from "./translations/es.json" with { type: "json" };
import strings from "./translations/index.json" with { type: "json" };
import jaStrings from "./translations/ja.json" with { type: "json" };


// Load assets
K.loadSpriteAtlas(spritemapDataURL, spritemapDef);
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
K.loadZzFXM("aaa", aaa);
K.loadZzFXM("bbb", bbb);
K.loadZzFXM("ccc", ccc);

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
