import { MUSIC_VOLUME } from "../constants";
import { K } from "../init";
import recolorRedShader from "./recolor-red.glsl";
import { aaa, bbb, ccc } from "./songs";
import { sounds } from "./sounds";
import spritemapDef from "./spritemap.json";
import spritemapDataURL from "./spritemap.png";
import strings from "./strings.json";
import translateShader from "./translate.glsl";
import fontDataURL from "./Web437_IBM_EGA_8x8.woff";
import worldFileSrc from "./world.txt";


// Load assets
K.loadSpriteAtlas(spritemapDataURL, spritemapDef);
K.loadZzFXMultiJSON(sounds);
K.loadStrings(strings);
K.loadFont("IBM Mono", fontDataURL);
K.loadShader("recolor-red", undefined, recolorRedShader);
K.loadShader("translate", undefined, translateShader);
K.loadZzFXM("aaa", aaa);
K.loadZzFXM("bbb", bbb);
K.loadZzFXM("ccc", ccc);

// Start music in background
// TODO: play bbb and ccc too
export const musicPlay = K.play("aaa", {
    loop: true,
    volume: MUSIC_VOLUME,
    paused: true,
});

export { worldFileSrc };
