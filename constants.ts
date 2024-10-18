/**
 * Pixel size for rendering
 *
 * * Use .5 for debugging
 * * Use 2.01 for standard game play (don't use an integer or it will be very buggy)
 */
export const SCALE = 2.01;

/**
 * Pixel scale for fonts - independent of SCALE
 */
export const FONT_SCALE = 2;

/**
 * Lowpass filter coefficient on camera pan.
 */
export const ALPHA = 0.05;

/**
 * Margin for UI components
 */
export const MARGIN = 20 / SCALE;

export const MUSIC_VOLUME = 0.1;

/**
 * Gravity for platformer
 */
export const GRAVITY = 600;

/**
 * Tile map grid size
 *
 * Don't change this, it is hardcoded in the spritemap
 */
export const TILE_SIZE = 32;

/**
 * Interaction distance
 */
export const INTERACT_DISTANCE = TILE_SIZE * 4;

/**
 * How often (in seconds) a footstep sound should be played
 * when the player is walking
 */
export const FOOTSTEP_INTERVAL = 0.25;

/**
 * Maximum speed (pixels/sec) at which the player moves
 */
export const WALK_SPEED = 64;

/**
 * Maximum speed (pixels/sec) at which a conveyor moves objects
 */
export const CONVEYOR_SPEED = 64;

/**
 * Force of the fans.
 */
export const WIND_FORCE = 300;

/**
 * Physical friction for all moving objects
 */
export const FRICTION = 0.25;

/**
 * Physical bounciness for all moving objects
 */
export const RESTITUTION = 0.2;

/**
 * Maximum velocity for a throw.
 */
export const MAX_THROW_VEL = 400;

/**
 * Maximum displacement for the throw velocity.
 */
export const MAX_THROW_STRETCH = 200;

/**
 * Player terminal velocity
 */
export const TERMINAL_VELOCITY = 800;

/**
 * Player jump force
 */
export const JUMP_FORCE = 300;
