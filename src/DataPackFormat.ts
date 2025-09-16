import { LineCap, LineJoin, TextAlign } from "kaplay";

type JSONPrimitive = number | string | boolean | null;
type JSONArray = (JSONValue | undefined)[];
interface JSONObject {
    [key: string]: JSONValue | undefined;
}
type JSONValue = JSONPrimitive | JSONArray | JSONObject;

type XY = [x: number, y: number];

interface RenderData extends JSONObject {
    p: "rect" | "ellipse" | "polygon" | { s: string; f: number };
    d: [width: number, height: number] | [rx: number, ry: number, center: XY] | XY[];
    pos?: XY;
    scale?: XY;
    angle?: number;
    skew?: XY;
    color?: string;
    opacity?: number;
    shader?: string;
    /** & = intersect, - = subtract */
    mask?: "&" | "-";
    uniform?: Record<string, JSONValue>;
    blend?: "normal" | "+" | "*" | "screen" | "over";
    outline?: {
        width?: number;
        color?: string;
        opacity?: number;
        join?: LineJoin;
        miterLimit?: number;
        cap?: LineCap;
        layer?: string;
    };
    layer?: string;
    z?: number;
}

export interface AssetData extends JSONObject {
    id: string;
    kind: "font" | "shader" | "sprite" | "spritemap" | "spritefont" | "sound" | "song" | "translation";
    /** for "url" it's fetched and decoded; for "bin" it's passed through atob (base64 decode) */
    loader?: "url" | "bin" | "zzfx" | "zzfxm";
    /** url, base64, or inline JSON */
    src: JSONValue;
    /** for spritemap, this is the slice data etc., for songs it is the author and song tags, for translations it is the language */
    metadata?: JSONValue;
}

type IndexMapping = number | { i: number, f: number };
/** The static (unchangeable) data for a single room */
interface RoomData extends JSONObject {
    /** Text map rows */
    map: string[];
    /**
     * The noninteractable environment tiles that make up the bulk of the world.
     *
     * number -> low min number of bits to store index into tileset array, upper bits are frame
     * negative number -> entity slot (first found is what is used if there are multiple of the same)
     *
     * list of numbers -> spawn multiple tiles here
     *
     * undefined or empty list -> nothing of course
     */
    indexMapping: Record<string, IndexMapping | IndexMapping[]>;
    /** ID of the tileset to use, such as office */
    tileset: string;
    /** List of the doors going in and out of this room */
    doors: DoorData[];
    /** Entities directly in here */
    entities: Record<string, EntityData>
}

interface StaticTileDefinition extends JSONObject {
    r: RenderData;
    /** if present, overrides frame set by tilemap bits */
    frame?: number;
    /** if not null, stuff will not fall through it; it's always an axis aligned rectangle */
    hitbox?: [...pos: XY, width: number, height: number];
    /** whether the obj can be merged to make more efficient colliders */
    merge?: [boolean, boolean];
    physics: {
        /** function or tags list to determine what to not collide with */
        ignore?: CrustyJSONCode | { tags: string[] };
        /** if not null, this is a ladder, these are the rung y-offsets */
        rungs?: number[];
    };
    /** if not null, the number of sprites to stack for the 2.5D effect. These will ALWAYS be drawn in the "background" layer */
    depth?: number;
}

interface TilesetData extends JSONObject {
    songTags: string[];
    tiles: StaticTileDefinition[];
}

interface DoorData extends JSONObject {
    /** shared name to connect the doors */
    link: string;
    /** in tiles */
    pos: XY;
    /** in tiles */
    size: XY;
    /** how to render the door */
    render?: string;
    /** if false, the player will have to "enter" the door manually; if true, it will teleport as soon as the player collides with it */
    auto: boolean;
}

interface EntityPrototypeData extends JSONObject {
    /** name of entity prototype to extend (via recursive Object.assign) */
    extends?: string;
    /** tags for "get" function; names and stuff also are used as tags */
    tags: string[];
    /** name of the sprite model to use for this */
    model: EntityModelData;
    /** polygonal hitbox */
    hitbox: XY[];
    /** restricted bounds on navigation height (in tiles) for pathfinding */
    navHeight: [low: number, high: number];
    /** if true, won't fall and can fly upwards and downwards */
    canFly: boolean;
    /** maximum move speed; sprint is always 1.5X higher */
    moveSpeed: number;
    /** the number of internal inventory slots this entity has */
    inventorySlots?: number;
    /** the number of slots that this entity takes up when held in an inventory */
    inventorySize?: number;
    hooks: Record<string, HookData>;
}

interface EntityModelData extends JSONObject {
    /** the body parts of the sprite */
    skeleton: EntityModelBoneData;
    /** the decorational or functional tentacles (spring sim thingies) */
    tentacles?: Record<string, EntityModelTentacleData>;
    /** definition of animations or emotes */
    anims?: Record<string, EntityAnimData>;
    /** The inverse-kinematics points that will be moved to create the natural motion driven animation */
    move: {
        walk: EntityMotionAnimDef[];
        climb: EntityMotionAnimDef[];
        look: EntityMotionAnimDef[];
        /** anim to be played while sprinting */
        sprint: EntityAnimData;
    }
}

interface EntityMotionAnimDef extends JSONObject {
    /** which bone target gets moved */
    bone: string;
    /** randomize jitter */
    jitter?: {
        pos?: XY;
        angle?: number;
    };
    /** if the bone should be flipped to follow the motion */
    flip?: [boolean, boolean];
}

interface EntityAnimData extends JSONObject {
    /** animations listed here will NOT blend with this one; if 2 try to override each other the last one wins */
    override: string[];
    mode: "once" | "loop" | "pingpong";
    channels: EntityAnimChannelData[];
};

interface EntityAnimChannelData extends JSONObject {
    /** path to target bone and property. example: ["head", "uniform", "u_color"], etc. */
    target: [bone: string, property: string, ...subProperties: string[]];
    offset: number;
    keyframes: [
        duration: number,
        value: string | number | XY,
        lerp?: string, // none = linear
    ][];
    /** if a sprite animation should be played concurrently */
    sprAnim: string;
}

interface EntityModelBoneData extends JSONObject {
    /** child bones */
    children?: EntityModelBoneData[];
    /** name of the bone for targeting it in animations */
    name: string;
    render: RenderData;
    /** The rotation center */
    pos: XY;
    /** inverse kinematics definition */
    ik: {
        /** maximum bending angles */
        angleRange: [number, number];
        /** angle ranges at which scale(-1, 1) or scale(1, -1) should be applied */
        flipRanges: [[number, number] | null, [number, number] | undefined];
        /** should only be set on the end */
        depth?: number;
    },
    constraint: {
        angle: [which: string, scale?: number, offset?: number];
    }
}

interface EntityModelTentacleData extends JSONObject {
    /** the id of the tentacle; segments will be named name0, name1, name2, ... */
    name: string;
    /** the length in number of segments */
    n: number;
    /** the length of each segment */
    lps: number;
    /** parent bone it is attached to */
    bone: string;
    /** local position on the attached bone */
    offset: XY;
    /** size range, optional interpolation function */
    sizes: [start: number, end: number, easingFunc?: string];
}

/**
 * hook env includes code, entity, local variables, context items, and path for traceback
 *
 * hook code to run for key events:
 *
 * * setup
 * * action1, action2, action3, action4, target1, target2 - context includes actor and opposing
 * * random_tick
 * * hit-entity - context includes entity and collision direction
 * * hit-tile - both collision events are run in the onBeforePhysicsResolve phase so they can be canceled
 * * taken - context includes entity taking it
 * * message - context includes the message and the sending entity
 * * state-changed - context includes whether it is supposed to be silent
 * * room_load
 * * room_unload
 * * game_load
 * * jump
 * * move
 * * step - context includes what i'm standing on
 * * climb
 * * leash - context includes leashing entity
 * * question - context includes what was asked and who asked
 * * became-player
 */
interface HookData extends JSONObject {
    /** hint to be displayed for direct control input hooks */
    hint?: string;
    /** hooks with a lower priority will be paused while this one runs */
    priority: number;
    impl: CrustyJSONCode;
}

interface EntityData extends JSONObject {
    /** name of the entity */
    id: string;
    /** id of the entity prototype */
    kind: string;
    /** this entity's state */
    state: JSONObject;
    /** if in a room, the tile slot */
    tileSlot?: number;
    /** if this entity should run its 'leash' hook when more than n tiles away from the owner */
    leashed?: [string, number];
    /** name of the link group to receive messages on */
    linkGroup?: string;
    /** if this is in some other entity's inventory */
    parent?: string;
    /** lighting lights things */
    lights: LightData[];
}

type LightData = [pos: XY, radius: number, intensity: number, color: string | number, only_lights?: (string | null)[]];

/**
 * like LISP.
 *
 * functions are:
 *
 * * be <state_slot> <value> <silent?> - replaces state slot with value
 * * as <entity> ... - changes the entity context
 * * do ... - block; previous line's results are available in local vars "it" and "them"
 * * when, if, unless, switch ... - branching
 * * each <list> <itemvar> ... - foreach loop
 * * while/until <condition> ...- potentially infinite loop
 * * ami <state_slot> <value?> - test state slot
 * * my <state_slot> - retrieve state slot
 * * state <newstate?> <silent?> - get (no args) or set (with args)
 * * render <name/path> <new_value> - getattr, setattr on rendering props
 * * anim/w <name> <speed> <force-restart?> - entity model play animation
 * * unanim <name> - remove anim from running list if it is an infinite anim
 * * playsound/w <name> <global?> - if global=false, the current player hears it
 * * say <scene?> <string> - says it in speech bubble, waits for player to continue, if scene is true then it uses the named dialogue scene vs the string verbatim
 * * the <name> - get context variable
 * * set <global?> <name> <value> - local variable
 * * get <global?> <name> - local variable
 * * here - get current entity's coordinates
 * * get <"all" | "first" | "random"> <type> <"near" radius in tiles> <"everywhere"> - get entities within radius
 * * send <message> - broadcasts message to all with the same link group (loaded or unloaded)
 * * spawn <entity_type> <location> -
 * * die - destroys self
 * * tp <entity> <room> <pos> - teleports
 * * take <item> - insert item into current entity's inventory, returns true or false if the other entity accepted or refused
 * * hold <item> - puts the item in the currently holding slot; returns false if not in inventory
 * * drop <item>
 * * throw <item>
 * * refuse - if this hook is a result of another entity's action, don't do that
 * * stop - early return from hook
 * * ask <entity> <question-name>
 * * answer <value> - respond to question from another entity
 * * set-player <entity> - switch controls and camera following to it
 * * win - causes the bluescreen and hasWon to be set to true
 * * look-at <entity> - rotates to look at it
 * * goto <location> - sets navigation goal
 * * +, -, *, /, ^, &, |, <, >, <=, >=, ==, !=, !, null?, # (len) - math stuff, work with vectors too if it would make sense (+, -, and / have 1-arity overloads: abs, neg, and inverse)
 * * join - concatenate strings or lists
 * * list <items...> - make list
 * * wait <time> <thinking?>
 * * hook <hook_name> <context> - triggers hook on self
 * * particles <amount> <color>
 * * lights <lights array>
 * * set-collision-ignore <tags array>
 * * conf <name> - get global configuration value
 * * rand <min> <max> | rand <list>
 * * me
 * * time
 * * template <value> <subs> - recursively substitutes the strings in values with the values in subs where they occur
 * * 
 *
 * TODO - figure out how to create/define inventory and config screens via this functionality.
 *
 * */
type CrustyJSONCode = [string, ...JSONValue[]];

interface Savefile extends JSONObject {
    /** true if the player has won the game */
    hasWon: boolean;
    /** mapping of room name -> room data */
    rooms: Record<string, RoomData>;
    /** list of entities that are not directly in a room */
    ownedEntities: EntityData[];
    /** id of the entity that is the current player */
    currentPlayer: string;
}

/** drawn using a PICTURE for optimization */
interface LoreDocumentData extends JSONObject {
    kind: "stack" | "row" | "col" | "text" | "pic";
    /** a color */
    background?: string;
    widths?: number[];
    /** For "stack" and "row" and "col" */
    children?: LoreDocumentData[];
    /** For "text" */
    text?: string;
    // TODO: specify styles and animated styles via data pack
    align?: TextAlign;
    /** For "pic" */
    sprite?: [name: string, width?: number, height?: number];
}

export interface DataPackData extends JSONObject {
    assets: AssetData[];
    dialogues: Record<string, CrustyJSONCode[]>;
    loreDocuments: Record<string, LoreDocumentData>;
    /** mapping of tileset name -> tile index -> definition */
    tilesets: Record<string, TilesetData>;
    /** crustyfunctions that can be called by user code */
    functions: Record<string, CrustyJSONCode>;
    /** configuration constants */
    config: Record<string, JSONValue>;
    /** K.Layers */
    renderLayers: [string[], string];
    /** entity type definitions */
    entityTypes: Record<string, EntityPrototypeData>;
    /** initial world state */
    initial: Savefile;
    /** metadata for the main menu stuff */
    meta: {
        title: string;
        sprite: string;
    };
    background?: string;
}
