/**
 * Pixel size for rendering
 */
export const SCALE = 1;

/**
 * Tile map grid size
 * Don't change this
 */
export const TILE_SIZE = 32;

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
export const CONVEYOR_SPEED = 32;

/**
 * Maximum velocity for a throw.
 */
export const MAX_THROW_VEL = 400;

/**
 * Maximum displacement for the throw velocity
 */
export const MAX_THROW_STRETCH = 80;

/**
 * Player terminal velocity
 */
export const TERMINAL_VELOCITY = 800;

/**
 * Player jump force
 */
export const JUMP_FORCE = 300;

/**
 * Options for playing the "bap" sound
 * to make it sound different.
 */
export const BAP_OPTS = {
    normal: () => ({ detune: -300 + 200 * Math.random(), volume: 0.5 + Math.random() / 2 }),
    climbing: () => ({ detune: Math.random() * 700, volume: 0.5 + Math.random() / 2 }),
    on: () => ({ detune: 1400 }),
    off: () => ({ detune: 900 }),
};
