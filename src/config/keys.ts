/**
 * Prefixes for all store names to prevent same-origin IndexedDB conflicts.
 *
 * !!!!! DON'T CHANGE THIS! !!!!
 */

export enum Keys {
    ROOT_PREFIX = "nova:",
    GLOBAL_SETTINGS = "global",
    PER_WORLD_MODS_KEY = "mods",
    GLOBAL_LAST_USED_MODS_KEY = "preferredMods",
    GLOBAL_PREFERENCES_KEY = "preferences",
    PER_WORLD_PREFERENCES_KEY = "localPreferences",
    GLOBAL_WORLDS_KEY = "worlds",
    WORLD_PREFIX = "world/",
    FILE_REF_KEY = "@",
}
