import { K } from "../init";
// @ts-expect-error
import spritemapDataURL from "./spritemap.png";
import spritemapDef from "./spritemap.json";
// @ts-expect-error
import fontDataURL from "./Web437_IBM_EGA_8x8.woff";
// @ts-expect-error
import recolorRedShader from "./recolor-red.glsl";
// @ts-expect-error
import translateShader from "./translate.glsl";
// @ts-expect-error
import worldFileSrc from "./world.txt";
import { sounds } from "./sounds";
import strings from "./strings.json"

// Load assets
K.loadSpriteAtlas(spritemapDataURL, spritemapDef);
K.loadZzFXMultiJSON(sounds);
K.loadStrings(strings);
K.loadFont("IBM Mono", fontDataURL);
K.loadShader("recolor-red", undefined, recolorRedShader);
K.loadShader("translate", undefined, translateShader);

export { worldFileSrc };
