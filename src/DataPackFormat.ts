import { EaseFuncs, TextAlign } from "kaplay";
import { JSONObject, JSONValue } from "./JSON";
import { PolylinePrimitive, Primitive } from "./draw/primitive";
import { BackgroundLayer } from "./context/plugins/kaplay-background-more";

export type XY = { x: number, y: number };

export type RenderData = Primitive;

export interface AssetData extends JSONObject {
    id: string;
    kind: "font" | "shader" | "sprite" | "spritemap" | "normalmap" | "spritefont" | "sound" | "song" | "translation" | "favicon";
    /** for "url" it's fetched and decoded; for "bin" it's passed through atob (base64 decode) */
    loader?: "conv" | "url" | "bin" | "zzfx" | "zzfxm";
    /** url, base64, or inline JSON */
    src: JSONValue;
    /** for spritemap, this is the slice data etc., for songs it is the title, author, and song tags */
    metadata?: JSONValue;
}

export type PhysicsComponentData =
    | StaticPhysicsComponentData
    | ["rect", x: number, y: number, w: number, h: number]
    | ["circle", x: number, y: number, r: number]
    | ["trace"]
    | ["poly", ...pts: XY[]]
    | ["mass", number];

export type StaticPhysicsComponentData =
    | ["surf", friction: number, restitution: number, stickyJump?: number, stickySlide?: number]
    | ["plat", number]
    | ["noColl", ...string[]]
    | ["eff", ...(["area", XY] | ["con", number])]
    | ["climb"]
    | ["static"];

export type IndexMapping = number | string;
/** The static (unchangeable) data for a single room */
export interface RoomData extends JSONObject {
    songTags: string[];
    /** Text map rows */
    map: string[];
    /**
     * The noninteractable environment tiles that make up the bulk of the world.
     *
     * number -> tile index to spawn
     *
     * string -> entity slot or door slot (last found is used)
     *
     * undefined or empty list -> nothing of course
     */
    indexMapping: Record<string, IndexMapping[]>;
    /** ID of the tileset to use, such as office */
    tileset: string;
    /** Entities directly in here */
    entities?: Record<string, EntityData>
    gravity?: number;
    init?: CrustyJSONCode;
}

// There must be a better way to do this.
export interface StaticTileDefinition extends JSONObject {
    render: RenderData;
    tags?: string[];
    /** Only use this if it's a sprite. */
    autotile?: {
        /** autotile with other tile tags; the number is the bits that it can connect with */
        with?: Record<string, number>;
        bits: 4 | 8,
        /** mapping of frame index -> tile connections bits.
         * if a bitset appears multiple times, an index will be chosen randomly.
         * fallback: if not present, the frame in the render data will be used.
         */
        pats: number[];
        weights?: number[];
    };
    // TODO: refactor this into a list of "components"
    // TODO: also add "physics components" to entity bones and main
    physics: {
        /** if not null, stuff will not fall through it; it's always an axis aligned rectangle */
        hitbox: [x: number, y: number, width: number, height: number];
        /** whether the obj can be merged to make more efficient colliders. It will only merge with the same kind of tile. */
        merge?: [horizontally: boolean, vertically: boolean];
        comps?: StaticPhysicsComponentData[]
    };
    /** if not null, the number of sprites to stack for the 2.5D effect. These will ALWAYS be drawn in the "background" layer */
    depth?: number | number[];
}

export interface TilesetData extends JSONObject {
    tiles: StaticTileDefinition[];
    gridSize: number;
    background?: string | BackgroundLayer[];
    initFunc?: CrustyJSONCode;
}

export interface EntityPrototypeData extends JSONObject {
    /** name of entity prototype to extend (via recursive Object.assign) */
    extends?: string;
    /** tags for "get" function; names and stuff also are used as tags */
    tags: string[];
    /** name of the sprite model to use for this */
    model?: EntityModelData;
    physics?: PhysicsComponentData[];
    behavior?: EntityBehaviorData;
    hooks: Record<string, HookData | CrustyJSONCode>;
}

export interface EntityBehaviorData extends JSONObject {
    canBePlayer?: boolean;
    moveSpeed: number;
    sprintSpeed?: number;
    /** if the camera should zoom in when me is the player */
    camScale?: number;
    /** jump force */
    jumpForce?: number;
    /** the number of internal inventory slots this entity has, if null or 0 it cannot pick up anything */
    inventorySlots?: number;
    /** the number of slots that this entity takes up when held in an inventory. if null, it cannot be picked up */
    inventorySize?: number;
    /** name of the bone that the held object will be pulled to */
    inventoryHolder?: string;
    /** distance in tiles */
    interactDistance?: number;
}

export interface EntityModelData extends JSONObject {
    /** the body parts of the sprite */
    skeleton: EntityModelBoneData[];
    /** the decorational or functional tentacles (spring sim thingies) */
    tentacles?: EntityModelTentacleData[];
    /** definition of animations or emotes */
    anims?: Record<string, EntityAnimData>;
    /** The inverse-kinematics points that will be moved to create the natural motion driven animation */
    kinematics?: {
        states: Record<string, EntityMoveAnimDef>;
        initial: string;
        look: EntityLookAnimDef;
    }
    speechBubble?: {
        origin: string;
        width?: number;
        tokenDelay: number;
        voiceSound: string;
    }
}

interface EntityLookAnimDef extends JSONObject {
    /** bone to use as origin when in mouse mode */
    origin: string;
    /** bone to move to the targeted entity */
    target: string;
}

export interface EntityMoveAnimDef extends JSONObject {
    bones?: EntityMovingBoneData[];
    anim: string;
    sprint?: string | [string, string];
    steps?: {
        len: number;
        time: number;
        height?: number;
    };
    /** state machine parameters determining when the state changes */
    transitions?: [string, EntityMotionStateMachineDef][];
    jumpRule: [EntityMotionStateMachineDef, changeState: string | undefined];
    allowedComponents?: XY;
    gravityScale?: number;
    leaveHook?: string;
    startHook?: string;
}

// TODO
export type EntityMotionStateMachineDef =
    | EntityMotionStateMachineFunction
    | EntityMotionStateMachineBoolExpr;
type EntityMotionStateMachineFunction =
    | ["grounded"] // if the entity is standing on the ground
    | ["moving"] // if the player input is nonzero
    | ["colliding", ...string[]] // if the entity is colliding with an object with all of these tags
    | ["manual"];
type EntityMotionStateMachineBoolExpr = [number, EntityMotionStateMachineDef, EntityMotionStateMachineDef, EntityMotionStateMachineDef | undefined, EntityMotionStateMachineDef | undefined, EntityMotionStateMachineDef | undefined]

export interface EntityMovingBoneData extends JSONObject {
    /** which bone target gets moved */
    bone: string;
    /** if the bone should be flipped/scaled to follow the motion */
    flip?: [
        whenMovingLeft: boolean | null,
        whenMovingRight: boolean | null,
        whenStopped: boolean | null,
        angleRangeLeft: [number, number] | null,
        angleRangeRight: [number, number] | null,
        angleRangeStopped: [number, number] | null,
    ];
    stepMode?: "step" | "jump" | "free"
    phaseOffset?: number;
    len?: number;
}

export interface EntityAnimData extends JSONObject {
    /** will pause these animations when started */
    interrupt?: string[];
    /** will forcibly stop these animations when started, */
    cancel?: string[];
    /** animations that will play in background but do nothing while this one's playing */
    shadow?: string[];
    loop?: boolean;
    /* if false, will reset back to the original value when the animation is turned off (default true) */
    sticky?: boolean;
    channels: EntityAnimChannelData[];
    autoplay?: boolean;
};

interface EntityAnimChannelData extends JSONObject {
    /** path to target bone and property. example: ["head", "uniform", "u_color"], etc. */
    target: [bone: string, property: string, ...subProperties: string[]];
    keyframes: [
        duration: number,
        value: string | number | XY | [number, number] | [XY, XY, circular?: boolean] | [string, string],
        lerp?: EaseFuncs, // none = linear
    ][];
    slerp?: boolean;
    /** 1/(time in seconds to move halfway on a step change) */
    alpha?: number;
    relative?: boolean;
    delay?: number;
}

export type EntityBoneConstraintOptData =
    | ["distance", which: string, distance: number, bounds: -1 | 0 | 1]
    | ["offset", which: string, offset: XY]
    | ["angle", which: string, scale?: number, offset?: number]
    | ["scale", which: string]

export interface EntityModelBoneData extends JSONObject {
    /** child bones */
    children?: EntityModelBoneData[];
    /** name of the bone for targeting it in animations */
    name?: string;
    render: RenderData;
    /** if true, this will have a 1x1 pixel collider set on it */
    sensor?: boolean;
    /** The offset from the parent */
    pos?: XY;
    /** inverse kinematics definition */
    ik: {
        /** maximum bending angles */
        angleRange: [min: number, max: number];
        /** the "looking direction" meaning of 0 degrees; this will be flipped to stay right size up */
        naturalDirection: XY;
        /** should only be set on the end */
        target?: [bone: string, depth: number];
    },
    constraint?: EntityBoneConstraintOptData;
}

export interface EntityModelTentacleData extends JSONObject {
    /** the id of the tentacle; segments will be named name0, name1, name2, ... */
    name: string;
    /** the length in number of segments */
    n: number;
    /** the length of each segment */
    lps: number;
    render: Omit<PolylinePrimitive, "pts" | "as">,
    extendDir?: XY
    gravityIsLocal?: boolean
    /** parent bone it is attached to */
    bone: string;
    /** local position on the attached bone */
    pos: XY;
    /** size range, optional interpolation function */
    sizes: [start: number, end: number, easingFunc?: string];
    /** mass range, optional interpolation function */
    masses: [start: number, end: number, easingFunc?: string];
    /** if true, the last bone will have forceSelf set to false, to allow it to be moved independently. */
    cord?: boolean;
    endConstraint?: EntityBoneConstraintOptData;
    eachConstraint?: EntityBoneConstraintOptData;
    alpha?: number;
    beta?: number;
}

/**
 * hook env includes code, entity, local variables, context items, and path for traceback
 *
 * hook code to run for key events:
 *
 * * setup
 * * action1, action2, action3, action4, target1, target2, action5, action6 - context includes actor and opposing
 * * randomTick
 * * hitEntity - context includes entity and collision direction
 * * hitTile - both collision events are run in the onBeforePhysicsResolve phase so they can be canceled
 * * taken - context includes entity taking it
 * * message - context includes the message and the sending entity
 * * stateChanged - context includes whether it is supposed to be silent
 * * roomLoad
 * * roomUnload
 * * gameLoad
 * * jump
 * * move
 * * sensor
 * * step - context includes what i'm standing on
 * * climb
 * * leash - context includes leashing entity
 * * question - context includes what was asked and who asked
 * * becamePlayer
 */
interface HookData extends JSONObject {
    /** hint to be displayed for direct control input hooks */
    hint?: string;
    /** hooks with a lower priority will be paused while this one runs */
    priority: number;
    impl: CrustyJSONCode;
}

export interface EntityData extends JSONObject {
    /** name of the entity */
    id: string;
    /** id of the entity prototype */
    kind: string;
    /** this entity's state */
    state?: JSONObject;
    /** absolute (if not in a tile slot) or relative (if yes) position in world */
    pos?: XY;
    /** if this entity should run its 'leash' hook when more than n tiles away from the owner */
    leashed?: [owner: string, distance: number];
    /** name of the link group to receive messages on */
    linkGroup?: string;
    /** if this is in some other entity's inventory */
    parent?: string;
    inventory?: string[];
}

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
 * * while/until <condition> ... - potentially infinite loop
 * * repeat <var> <range> ... -
 * * ami <state_slot> <value?> - test state slot
 * * my <state_slot> - retrieve state slot
 * * render <name/path> <new_value> - getattr, setattr on rendering props
 * * anim/w <name> <speed> <forceRestart?> - entity model play animation
 * * unanim <name> - remove anim from running list if it is an infinite anim
 * * playsound/w <name> <global?> - if global=false, the current player hears it
 * * say <scene?> <string> - says it in speech bubble, waits for player to continue, if scene is true then it uses the named dialogue scene vs the string verbatim
 * * the <name> - get context variable
 * * set <global?> <name> <value> - local variable
 * * get <global?> <name> - local variable
 * * here - get current entity's coordinates
 * * test <bone> <tag?> - test sensor for collision with object with tag, if bone is null use main hitbox
 * * select <"all" | "first" | "random"> <type> <"near" radius in tiles> <"everywhere"> - get entities within radius
 * * send <message> - broadcasts message to all with the same link group (loaded or unloaded)
 * * spawn <entity_type> <location> -
 * * die - destroys self
 * * tp <entity> <room> <pos> - teleports
 * * take <item> - insert item into current entity's inventory, returns "taken", "noRoom", or "refused"
 * * hold <item> - puts the item in the currently holding slot; returns false if not in inventory
 * * drop <item>
 * * throw <item>
 * * refuse - if this hook is a result of another entity's action, don't do that
 * * stop - early return from hook
 * * ask <entity> <questionName>
 * * answer <value> - respond to question from another entity
 * * bePlayer <entity> - switch controls and camera following to it
 * * win - causes the bluescreen and hasWon to be set to true
 * * lookAt <entity> - rotates to look at it
 * * goto <location> - sets navigation goal
 * * +, -, *, /, ^, &, |, <, >, <=, >=, ==, !=, !, null?, # (len) - math stuff, work with vectors too if it would make sense (+, -, and / have 1-arity overloads: abs, neg, and inverse)
 * * join - concatenate strings or lists
 * * list <items...> - make list
 * * wait <time> <thinking?>
 * * hook <hook_name> <context> - triggers hook on self
 * * particles <amount> <color>
 * * lights <lights array>
 * * setCollisionIgnore <tags array>
 * * collideWith <tag>
 * * dontCollideWith <tag>
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
export type CrustyJSONCode = [string, ...JSONValue[]];

export interface Savefile extends JSONObject {
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
    title: {
        /** Name of the entity kind to display on the title screen */
        entity: string;
        ui: {
            sounds: {
                select: string;
                switch: string;
                open: string;
                back: string;
                action: string;
            },
            sprites: {
                focus: string;
                button: string;
                checkbox: string;
                radio: string;
                switch: string;
                sliderTrack: string;
                sliderThumb: string;
            },
            colors: {
                normal: string;
                focus: string;
                hover: string;
            }
        }
    };
    defaults: {
        font?: string;
        depth?: number;
        background?: string;
        depthLayer: string;
        gravity?: number;
        entityLayer: string;
        tileLayer: string;
        friction: number;
        restitution: number;
        speechBubbleWidth?: number;
        cameraPanAlpha: number;
        cameraScaleAlpha: number;
    }
}
