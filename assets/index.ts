import { MUSIC_VOLUME } from "../constants";
import { K } from "../init";
import { playMusic } from "./music";
import rumbleEffects from "../assets/rumbleEffects.json";
import recolorRedShader from "./recolor-red.glsl";
import { aaa, bbb, ccc } from "./songs";
import { sounds } from "./sounds";
import spritemapDef from "./spritemap.json" with { type: "json" };
import spritemapDataURL from "./spritemap.png";
import translateShader from "./translate.glsl";
import invertShader from "./invert.glsl";
import deStrings from "./translations/de.json" with { type: "json" };
import enStrings from "./translations/en.json" with { type: "json" };
import esStrings from "./translations/es.json" with { type: "json" };
import strings from "./translations/index.json" with { type: "json" };
import jaStrings from "./translations/ja.json" with { type: "json" };
import ibmMonoFontDataURL from "./Web437_IBM_EGA_8x8.woff";
import unsciiMCRFontDataURL from "./unscii-8-mcr.woff";
import worldFileSrc from "./world.txt";


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
K.loadShader("recolor-red", undefined, recolorRedShader);
K.loadShader("translate", undefined, translateShader);
K.loadShader("invert", undefined, invertShader);
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

// Start music in background
export const musicPlay = playMusic({
    loop: true,
    volume: MUSIC_VOLUME,
    paused: true,
});

export { worldFileSrc };
