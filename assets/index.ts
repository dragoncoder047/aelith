import { MUSIC_VOLUME } from "../constants";
import { K } from "../init";
import { aaa } from "./aaa";
import { sounds } from "./sounds";
import spritemapDef from "./spritemap.json";
import strings from "./strings.json";
// @ts-expect-error
import spritemapDataURL from "./spritemap.png";
// @ts-expect-error
import fontDataURL from "./Web437_IBM_EGA_8x8.woff";
// @ts-expect-error
import recolorRedShader from "./recolor-red.glsl";
// @ts-expect-error
import translateShader from "./translate.glsl";
// @ts-expect-error
import worldFileSrc from "./world.txt";


// Load assets
K.loadSpriteAtlas(spritemapDataURL, spritemapDef);
K.loadZzFXMultiJSON(sounds);
K.loadStrings(strings);
K.loadFont("IBM Mono", fontDataURL);
K.loadShader("recolor-red", undefined, recolorRedShader);
K.loadShader("translate", undefined, translateShader);
K.loadZzFXM("aaa", aaa);

// Start music in background
export const musicPlay = K.play("aaa", {
    loop: true,
    volume: MUSIC_VOLUME,
    paused: true,
});

export { worldFileSrc };
