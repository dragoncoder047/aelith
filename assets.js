import K from './init.js';

// Load assets
K.loadSpriteAtlas("assets/spritemap.png", "assets/spritemap.json");
K.loadSound("jump", "assets/sounds/jump.wav");
K.loadSound("thud", "assets/sounds/thud.ogg");
K.loadSound("bap", "assets/sounds/bap.ogg");
K.loadBitmapFont("unscii", "assets/unscii_8x8.png", 8, 8);
K.loadShaderURL("blink", null, "assets/blink.glsl", null);
export const WORLD_FILE = "assets/world.txt";
// cSpell: ignore unscii glsl
