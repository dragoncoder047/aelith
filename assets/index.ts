import { K } from "../init";

// Load assets
K.loadSpriteAtlas("assets/spritemap.png", "assets/spritemap.json");
K.loadSound("jump", "assets/sounds/jump.wav");
K.loadSound("thud", "assets/sounds/thud.ogg");
K.loadSound("bap", "assets/sounds/bap.ogg");
K.loadFont("IBM Mono", "assets/Web437_IBM_EGA_8x8.woff");
K.loadShaderURL("blink", undefined, "assets/blink.glsl");
K.loadShaderURL("rollingdoor", undefined, "assets/rollingdoor.glsl");
export const WORLD_FILE = "assets/world.txt";
// cSpell: ignore glsl
