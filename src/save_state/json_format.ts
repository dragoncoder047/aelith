import { Anchor, UniformKey } from "kaplay";

type JSONPrimitive = number | string | boolean | null;
type JSONArray = JSONValue[];
interface JSONObject {
    [key: string]: JSONValue;
}
type JSONValue = JSONPrimitive | JSONArray | JSONObject;

type XY = [x: number, y: number];

interface AssetData extends JSONObject {
    id: string;
    kind: "font" | "shader" | "sprite" | "spritemap" | "sound" | "song";
    /** for "url" it's fetched and decoded; for "bin" it's passed through atob (base64 decode) */
    loader: "url" | "bin" | "zzfx" | "zzfxm" | null;
    /** url, base64, or inline */
    src: string;
    metadata: JSONObject | null;
}

/** The static (unchangeable) data for a single room */
interface RoomData extends JSONObject {
    /**
     * The noninteractable environment tiles that make up the bulk of the world.
     *
     * number -> low min number of bits to store index into tileset array, upper bits are frame
     * negative number -> entity slot (first found is what is used if there are multiple of the same)
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
    /** if not null, stuff will not fall through it; it's always an axis aligned rectangle */
    hitbox: [...pos: XY, width: number, height: number] | null;
    /** whether the obj can be merged to make more efficient colliders */
    merge: [boolean, boolean] | null;
    physics: {
        /** function or tags list to determine what to not collide with */
        ignore: CrustyJSONCode | { tags: string[] } | null;
        /** if not null, this is a ladder, these are the rung y-offsets */
        rungs: number[] | null;
    };
    /** if not null, the number of sprites to stack for the 2.5D effect */
    depth: number | null;
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
    /** tags for "get" function; names and stuff also are used as tags */
    tags: string[];
    /** name of the sprite model to use for this */
    model: EntityModelData;
    /** polygonal hitbox */
    hitbox: XY[];
    /** restrict bounds on navigation height (in tiles) for pathfinding */
    navHeight: [low: number, high: number];
    /** if true, won't fall and can fly upwards and downwards */
    canFly: boolean;
    /** maximum move speed; sprint is always 1.5X higher */
    moveSpeed: number;
    /** the number of internal inventory slots this entity has */
    inventorySlots: number | null;
    /** the number of slots that this entity takes up when held in an inventory */
    inventorySize: number;
    hooks: Record<string, HookData>;
}

interface EntityModelData extends JSONObject {
    /** the body parts of the sprite */
    skeleton: EntityModelBoneData;
    /** the decorational or functional tentacles (spring sim thingies) */
    tentacles: Record<string, EntityModelTentacleData>;
    /** definition of animations or emotes */
    anims: Record<string, EntityAnimData>;
    /** the bone that will be made to turn to face whatever the entity is looking at */
    eyeTarget: string | null;
    /** The inverse-kinematics points that will be moved to create the */
    moveBones: {
        walk: EntityMotionAnimDef[];
        climb: EntityMotionAnimDef[];
        look: EntityMotionAnimDef[];
    }
}

interface EntityMotionAnimDef extends JSONObject {
    /** which bone target gets moved */
    bone: string;
    /** randomize jitter */
    jitter: {
        pos: XY | null;
        angle: number | null;
    } | null;
}

interface EntityAnimData extends JSONObject {
    /** animations listed here will NOT blend with this one */
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
        lerp: string | null, // null = linear
    ][];
}

interface EntityModelBoneData extends JSONObject {
    /** child bones */
    children: EntityModelBoneData[] | null;
    /** name of the bone for targeting it in animations */
    name: string;
    render: {
        sprite: string;
        layer: string;
        color: string | null;
        anchor: Anchor | XY | null;
        shader: string | null;
        scale: XY | null;
        uniform: Record<UniformKey, number | number[] | string | string[]>;
    };
    /** The rotation center */
    pos: XY;
    /** inverse kinematics definition */
    ik: {
        /** maximum bending angles */
        angleRange: [number, number];
        /** angle ranges at which scale(-1, 1) or scale(1, -1) should be applied */
        flipRanges: [[number, number] | null, [number, number] | null];
        /** should only be set on the end */
        depth: number | null;
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
    sizes: [number, number, string | null];
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
 * * state_changed - context includes whether it is supposed to be silent
 * * room_load
 * * room_unload
 * * game_load
 * * jump
 * * move
 * * step - context includes what i'm standing on
 * * climb
 * * leash - context includes leashing entity
 * * question - context includes what was asked and who asked
 * * became_player
 */
interface HookData extends JSONObject {
    /** hint to be displayed for direct control input hooks */
    hint: string | null;
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
    /** location: room and tile xy pos, or room and tile slot */
    loc: [string, XY | number] | null;
    /** if this entity should run its 'leash' hook when more than n tiles away from the owner */
    leash: [string, number] | null;
    /** if this is in some other entity's inventory */
    parent: string | null;
    /** lighting lights things */
    lights: LightData[];
}

type LightData = [pos: XY, radius: number, intensity: number, color: string | number, only_lights: (string | null)[] | null];

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
 * * say <string> - says it in speech bubble, waits for player to continue
 * * the <name> - get context variable
 * * set <global?> <name> <value> - local variable
 * * get <global?> <name> - local variable
 * * here - get current entity's coordinates
 * * get <"all" | "first" | "random"> <type> <"near" radius in tiles> <"everywhere"> - get entities within radius
 * * spawn <entity_type> <location> -
 * * die - destroys self
 * * tp <entity> <pos> - teleports
 * * take <item> - insert item into current entity's inventory, returns true or false if the other entity accepted or refused
 * * hold <item> - puts the item in the currently holding slot; returns false if not in inventory
 * * drop <item>
 * * throw <item>
 * * refuse - if this hook is a result of another entity's action, don't do that
 * * stop - early return from hook
 * * ask <entity> <question-name>
 * * answer <value> - respond to question from another entity
 * * set-player <entity> - switch controls and camera following to it
 * * set-won - causes the bluescreen
 * * look-at <entity> - rotates to look at it
 * * goto <location> - sets navigation goal
 * * +, -, *, /, ^, &, |, <, >, <=, >=, ==, !=, !, null?, # (len) - math stuff, work with vectors too if it would make sense (+, -, and / have 1-arity overloads: abs, neg, and inverse)
 * * join - concatenate strings or lists
 * * list <items...> - make list
 * * wait <time> <thinking?>
 * * run-hook <hook_name> <context> - triggers hook on self
 * * particles <amount> <color>
 * * set-lights <lights array>
 * * set-collision-ignore <tags array>
 * * conf <name> - get global configuration value
 * * rand <min> <max> | rand <list>
 * * me
 * * time
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
    /** list of entities */
    entities: EntityData[];
    /** id of the entity that is the current player */
    currentPlayer: string;
}

interface DataDataData extends JSONObject {
    assets: AssetData[];
    loreDocuments: Record<string, LoreDocumentData>;
    /** mapping of tileset name -> tile index -> definition */
    tilesets: Record<string, StaticTileDefinition[]>;
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
}
