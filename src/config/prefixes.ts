/**
 * Prefixes for all store names to prevent same-origin IndexedDB conflicts.
 *
 * !!!!! DON'T CHANGE THIS! !!!!
 */

export enum Prefixes {
    ROOT_PREFIX = "lithengine:",
    MODSETS = "modsets",
    WORLDS = "worlds",
    WORLD_PREFIX = "world/"
}
