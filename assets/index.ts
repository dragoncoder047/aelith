import { K } from "../init";

// Load assets
K.loadSpriteAtlas("assets/spritemap.png", "assets/spritemap.json");
K.loadZzFX("thud", [,.1,100,,,.05,,,,,-40,.01,.02,2,,,,,,,-2e3]);
K.loadZzFX("jump", [.3,,300,.01,,.3,,0,2.1]);
K.loadZzFX("footsteps", [,.5,120,,,.01,2]);
K.loadZzFX("climbing", [,.05,1e3,,,.01,1,,,,,,,,,.1]);
K.loadZzFX("teleport", [,0,440,,,.6,1,,,2e3,,,.05,,,,.005]);
K.loadZzFX("checkpoint", [,0,1e3,,,.4,1,,,,290,.07,.07,,,,,,.1,1]);
K.loadZzFX("grab", [,,100,,,,4,2]);
K.loadZzFX("throw", [.4,,440,.05,,,,,,,,,,3]);
K.loadZzFX("switch_on", [,,630,,,.01,2,,,,,,,,,.1]);
K.loadZzFX("switch_off", [,,500,,,.01,2,,,,,,,,,.1]);
K.loadFont("IBM Mono", "assets/Web437_IBM_EGA_8x8.woff");
K.loadShaderURL("blink", undefined, "assets/blink.glsl");
K.loadShaderURL("translateSprite", undefined, "assets/translate.glsl");
export const WORLD_FILE = "assets/world.txt";
// cSpell: ignore glsl
