type JSONPrimitive = number | string | boolean | null;
type JSONArray = JSONValue[];
interface JSONObject {
    [key: string]: JSONValue;
}
type JSONValue = JSONPrimitive | JSONArray | JSONObject;

type XY = [number, number];

/** The static (unchangeable) data for a single room */
interface RoomData extends JSONObject {
    /**
     * The noninteractable environment tiles that make up the bulk of the world.
     *
     * number -> min number of bits to store index into tileset array, upper bits are frame
     *
     * list of numbers -> spawn multiple tiles here
     *
     * empty list -> nothing of course
     */
    tiles: (number | number[] | null)[][];
    /** ID of the tileset to use, such as office */
    tileset: string;
    /** List of the doors going in and out of this room */
    doors: DoorData[];
}

interface StaticTileDefinition extends JSONObject {
    /** The id of the tile's sprite, such as rusty_steel */
    sprite: string | null;
    /** if present, overrides frame set by tilemap bits */
    frame: number | null;
    /** if not null, stuff will not fall through it; it's a polygon */
    hitbox: XY[] | null;
    collisionIgnore: HookCode | null;
    /** if an array, the hitbox is the polygon point the actor must collide with to be "on" the ladder; y-values here are the y-values of the rungs */
    rungs: number[] | null;
    /** if not null, the number of sprites to stack for the 2.5D effect */
    depth: number | null;
    /** rules to determine nav grid where the nodes can go in and out (useful for the "crossover" thing) */
    navRules: NavRuleData;
}

/** each key is the places that paths can go into this tile; the keys are the corresponding exit directions */
interface NavRuleData extends JSONObject {
    u: `${"u" | ""}${"d" | ""}${"l" | ""}${"r" | ""}`;
    d: `${"u" | ""}${"d" | ""}${"l" | ""}${"r" | ""}`;
    l: `${"u" | ""}${"d" | ""}${"l" | ""}${"r" | ""}`;
    r: `${"u" | ""}${"d" | ""}${"l" | ""}${"r" | ""}`;
    dynamic: HookCode | null;
}

interface DoorData extends JSONObject {
    /** shared name to connect the doors */
    link: string;
    /** in tiles */
    pos: XY;
    /** in tiles */
    size: XY;
    /** how to render the door */
    sprite: string | null;
    /** if false, the player will have to "enter" the door manually; if true, it will teleport as soon as the player collides with it */
    auto: boolean;
}

interface EntityPrototypeData extends JSONObject {
    /** name of entity prototype to extend (via recursive Object.assign) */
    extends: string | null;
    /** tags for "get" function */
    tags: string[];
    /** name of the sprite model to use for this */
    model: string;
    /** restrict bounds on navigation height (in tiles) */
    navHeight: [low: number, high: number];
    /** if true, won't fall and can fly upwards and downwards */
    canFly: boolean;
    moveSpeed: number;
    hooks: Record<string, HookData>;
}

/**
 * hook env includes code, entity, local variables, context items, and path for traceback
 *
 * hook code to run for key events:
 *
 * * setup
 * * action1, action2, action3, action4, target1, target2 - context includes actor and opposing
 * * random_tick
 * * collide_with - context includes entity and collision direction
 * * taken - context includes entity taking it
 * * state_changed - context includes whether it is supposed to be silent
 * * sleep
 * * wake
 * * load
 * * leash - context includes leashing entity
 * * question - context includes what was asked
 * * became_player
 */
interface HookData extends JSONObject {
    hint: string | null;
    priority: number;
    impl: HookCode;
    lights: LightData[];
}

interface EntityData extends JSONObject {
    id: string;
    kind: string;
    state: JSONObject;
    /** mutually exclusive for owner */
    location: string | null;
    owner: string | null;
}

type LightData = [pos: XY, radius: number, intensity: number, color: string, lights: string[] | null];

/**
 * like LISP.
 *
 * functions are:
 *
 * * add/remove <state_slot> <value?> - state_slot must be set up as a list if multiple value, context is entity executing command
 * * be <state_slot> <value> <silent?> - replaces state slot with value
 * * as <eid> ... - changes the entity context
 * * do ... - block; previous line's results are available in local vars "it" and "them"
 * * when, if, unless, switch ... - branching
 * * each <list> ... - loop
 * * am <state_slot> <value?> - test state slot
 * * my <state_slot> - retrieve state slot
 * * animate <name> - entity model play animation
 * * playsound <name> <global?> - if global=false, the current player hears it
 * * say <string> - says it in speech bubble, waits for player to continue
 * * the <name> - get context variable
 * * set <global?> <name> <value> - local variable
 * * get <global?> <name> - local variable
 * * here - get current entity's coordinates
 * * get <"all" | "first" | "random"> <type> <"near" radius in tiles> <"everywhere"> - get entities within radius
 * * spawn <entity_type> <location> -
 * * take <item> - insert item into current entity's inventory, returns true or false if the other entity accepted or refused
 * * drop <item>
 * * throw <item>
 * * refuse - if this hook is a result of another entity's action, don't do that
 * * cancel - early return from hook
 * * make_player <entity> - switch controls and camera following to it
 * * set_win - causes the bluescreen
 * * look_at <entity> - rotates to look at it
 * * goto <location> - sets navigation goal
 * * leash <entity> <distance> - when entity goes more than <distance> tiles from me, will get leash hook run
 * * answer <value> - respond to question from another entity
 * * +, -, *, /, ^, &, |, <, >, <=, >=, ==, !=, !, null? - math stuff (+, -, and / have 1-arity overloads: abs, neg, and inverse)
 * * join - concatenate strings or lists
 * * wait <time> <thinking?>
 * * run_hook <hook_name> <context> - triggers hook on self
 * * particles <amount> <color>
 * * set_lights <
 * * conf <name> - get global configuration value
 *
 * TODO - figure out how to create/define inventory and config screens via this functionality.
 *
 * */
type HookCode = [string, ...any];

interface Savefile extends JSONObject {
    hasWon: boolean;
    rooms: Record<string, RoomData>;
    /** must include player, nic, and spaceship */
    entities: EntityData[];
    entityTypes: Record<string, EntityPrototypeData>;
    onLoad: HookCode[];
}

interface SpriteModelData extends JSONObject {
    // todo. needs to include kinematic bones, physics bones (tentacles)
    // and animations and stuff. needs to be a way to "blend" two animations or poses
    // to allow stuff like holding an item while climbing or something
}
