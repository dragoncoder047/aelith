// cSpell: ignore kaplay

import {
    Vec2,
    type AreaComp,
    type AreaCompOpt,
    type BodyComp,
    type Collision,
    type CompList,
    type GameObj,
    type LevelComp,
    type SpriteComp
} from 'kaplay';
import { WORLD_FILE } from './assets';
import { button } from './components/button';
import { clicky } from './components/click_noise';
import { conveyor } from './components/conveyor';
import { grabbable } from './components/grabbable';
import { hoverOutline } from './components/hoverOutline';
import { infFriction } from './components/infFriction';
import { linked } from './components/linked';
import { nudge } from './components/nudge';
import { spriteToggle } from './components/spriteToggle';
import { thudder } from './components/thudder';
import { toggler } from './components/toggler';
import { toggleSwitch } from './components/toggleSwitch';
import {
    BAP_OPTS,
    FOOTSTEP_INTERVAL,
    JUMP_FORCE,
    MAX_THROW_STRETCH,
    MAX_THROW_VEL,
    SCALE,
    TERMINAL_VELOCITY,
    TILE_SIZE,
    WALK_SPEED
} from './constants';
import K from './init';
import './layers';

var world: GameObj<LevelComp>;


/**
 * Create default components for common tile objects.
 */
function defaults(areaOpts?: AreaCompOpt): CompList<any> {
    return [
        K.area(areaOpts!),
        K.anchor("center"),
        K.offscreen({ hide: true }),
        K.timer(),
        K.rotate(0),
        K.outline(0, K.WHITE),
    ];
}

/**
 * Return components for a machine
 */
function machine(areaOpts?: AreaCompOpt): CompList<any> {
    return [
        toggler("off", "on", false),
        K.state("off"),
        linked(MParser.uid()),
        ...defaults(areaOpts)
    ];
}

/**
 * Components for a moveable, grabbable box.
 */
function box(): CompList<any> {
    return [
        K.sprite("box", { fill: false }),
        "box",
        K.body(),
        // make box a teeny bit smaller so that it fits down holes
        // and I don't have to stomp on it
        ...machine({ scale: (TILE_SIZE - 1) / TILE_SIZE }),
        hoverOutline(),
        K.tile({ isObstacle: true }),
        thudder(),
        grabbable(),
        K.z(0),
        infFriction(),
        {
            // TODO: fix this logic
            hittingPlayer: false,
            wasHittingPlayer: false,
            add(this: GameObj<SpriteComp | BodyComp | AreaComp>) {
                this.frame = K.randi(this.numFrames());
                this.onBeforePhysicsResolve((coll: Collision) => {
                    if (this === player.grabbing) {
                        this.hittingPlayer = true;
                        coll.preventResolution();
                    }
                    if (coll.target === player && this.wasHittingPlayer) {
                        this.hittingPlayer = true;
                    }
                    if (this.hittingPlayer) {
                        coll.preventResolution();
                    }
                });
            },
            draw() {
                this.wasHittingPlayer = this.hittingPlayer;
                this.hittingPlayer = false;
            }
        }
    ];
}

/**
 * helper function for MParser
 */
function stackOp(from: string, to: string): (this: typeof MParser) => void {
    if ([].some.call(from, (ch: string, i: number) => from.indexOf(ch) !== i))
        throw new Error("stack op definition error: duplicate input names: " + from);
    if ([].some.call(to, (ch: string) => from.indexOf(ch) === -1))
        throw new Error("stack op definition error: undefined character in output: " + to);
    const reversedFrom: number[] = [].slice.call(from).reverse();
    return function (this: typeof MParser) {
        const nameMap = {};
        for (var c of reversedFrom) {
            nameMap[c] = this.stack.pop();
        }
        for (var c of to) {
            this.stack.push(nameMap[c]);
        }
    };
}

/**
 * Main parser handler for level map data (in WORLD_FILE).
 */
const MParser: {
    spawners: { [x: string]: () => CompList<any> },
    storedProcedures: { [x: string]: string },
    commands: { [x: string]: (this: typeof MParser) => void },
    fixedTiles: { [x: string]: (this: typeof MParser) => CompList<any> },
    buffer: string | number | null,
    parenStack: string[],
    process(cmd: string, pos: Vec2): CompList<any>,
    mergeAcross(world: GameObj<LevelComp>): void,
    cleanBuffer(): void,
    build(world: GameObj<LevelComp>): void,
    commandQueue: (string | number | import("kaplay").Vec2 | (() => void))[],
    stack: any[],
    uid(): string,
} = {
    /**
     * Commands that spawn a machine at that particular location.
     */
    spawners: {
        L: () => [
            K.sprite("light"),
            spriteToggle(),
            ...machine(),
            K.anchor("bot"),
        ],
        S: () => [
            K.sprite("switch"),
            spriteToggle(),
            ...machine(),
            hoverOutline(),
            K.anchor("bot"),
            toggleSwitch(),
            clicky(),
        ],
        B: () => [
            K.sprite("button"),
            spriteToggle(),
            nudge(0, 12),
            ...machine({ offset: K.vec2(0, 3) }),
            K.body({ isStatic: true }),
            button(),
            clicky(),
        ],
        C: () => [
            K.sprite("conveyor"),
            spriteToggle(),
            ...machine(),
            K.body({ isStatic: true }),
            conveyor(),
            K.surfaceEffector({ speed: 0, forceScale: Number.MAX_VALUE }),
            nudge(0, 8),
        ],
        X: box,
    },
    storedProcedures: {},
    /**
     * Parser commands that are executed post-world-creation
     * to initialize the machines.
     */
    commands: {
        // drop/done command: anything -- nothing
        "."() {
            this.stack.pop();
        },
        // negate command: number -- number
        "-"() {
            this.stack.push(-this.stack.pop());
        },
        // set property: obj pName value -- obj
        s() {
            var value = this.stack.pop();
            var propName = this.stack.pop();
            var obj = this.stack.pop();
            obj[propName] = value;
            this.stack.push(obj);
        },
        // rotate by degrees: obj degrees -- obj
        r() {
            var degrees = this.stack.pop();
            var object = this.stack.pop();
            object.angle += degrees;
            this.stack.push(object);
        },
        // nudge: obj x y -- obj
        n() {
            var y = this.stack.pop();
            var x = this.stack.pop();
            var obj = this.stack.pop();
            obj.use(nudge(x, y));
            this.stack.push(x);
        },
        // link command: oN ... o3 o2 o1 number id? -- oN ... o3 o2 o1
        $() {
            var n = this.stack.pop();
            var link = this.uid();
            if (typeof n === "string") {
                link = n;
                n = this.stack.pop();
            }
            var off = [];
            for (var i = 0; i < n; i++) {
                var item = this.stack.pop();
                item.tag = link;
                off.push(item);
            }
            while (off.length > 0)
                this.stack.push(off.pop());
        },
        // define command: value name --
        d() {
            var pName = this.pop();
            var pContent = this.pop();
            this.storedProcedures[pName] = pContent;
        },
        // get command: name -- value
        g() {
            var pName = this.pop();
            var val = this.storedProcedures[pName];
            if (val === undefined)
                throw "undefined: " + pName;
            this.stack.push(val);
        },
        // call command: *arguments name -- *values
        c() {
            var pName = this.pop();
            var proc = this.storedProcedures[pName];
            if (proc === undefined)
                throw "undefined: " + pName;
            this.commandQueue.unshift(proc);
        },
        // loop command: code n -- *anything
        l() {
            var times = this.stack.pop();
            var code = this.stack.pop();
            for (var i = 0; i < times; i++) {
                this.commandQueue.unshift(code);
            }
        },
        // push a uid
        u() {
            this.stack.push(this.uid());
        },
        // stack ops
        "\\": stackOp("ab", "ba"), // swap
        "&": stackOp("abc", "bca"), // roll
        ":": stackOp("a", "aa"), // dup
    },
    /**
     * Commands that spawn a tile type that isn't configurable.
     */
    fixedTiles: {
        "@": () => [
            "playerPosition",
            // for debugging only, the @ tile is removed
            K.rect(10, 10),
            K.color(K.GREEN),
            K.anchor("center"),
            K.area(),
            // player is handled separately
        ],
        "#": () => [
            K.sprite("steel"),
            K.body({ isStatic: true }),
            K.tile({ isObstacle: true }),
            ...defaults(),
            "wall",
        ],
        "=": () => [
            K.sprite("ladder"),
            ...defaults(),
            // override default with smaller shape to make
            // falling-off-the-ladder have more realistic bounds
            K.area({ scale: 1.0 / TILE_SIZE }),
            "ladder",
        ],
    },
    /**
     * Used to hold intermediate parsing results.
     */
    buffer: null,
    parenStack: [],
    process(cmd, pos) {
        const oldLen = this.parenStack.length;
        if (cmd == "[" || cmd == "(" || cmd == "{") {
            this.parenStack.push(cmd);
        }
        if (this.parenStack.length > 0) {
            const popParen = (p) => {
                if (!this.parenStack.length) throw "unmatched paren " + p;
                const oldState = this.parenStack.pop();
                const expected = { "{": "}", "[": "]", "(": ")" }[oldState];
                if (p != expected) throw "mismatched parens " + oldState + " " + p;
            };
            if (cmd == "]" || cmd == ")" || cmd == "}") {
                popParen(cmd);
                if (this.parenStack.length == 0) {
                    if (cmd === ")") {
                        this.cleanBuffer();
                    }
                    else if (cmd === "}") {
                        this.cleanBuffer();
                        const code = this.commandQueue.pop();
                        if (typeof code !== "string") throw "oops string";
                        this.commandQueue.push(() => {
                            this.parenStack = [];
                            this.buffer = null;
                            const oLen = this.commandQueue.length;
                            for (var i = 0; i < code.length; i++) {
                                this.process(code[i], null);
                            }
                            if (this.parenStack.length > 0) throw "oops parens";
                            if (this.commandQueue.length === oLen && code != "") throw "oops nothing";
                            const procSource = this.commandQueue.splice(oLen, this.commandQueue.length - oLen);
                            this.commandQueue.unshift(() => {
                                this.stack.push(() => {
                                    this.commandQueue = procSource.concat(this.commandQueue);
                                });
                            });
                        });
                    }
                    return;
                }
            }
            if ((oldLen > 0 || this.parenStack.length > 1) && this.parenStack[0] !== "[") {
                if (this.buffer === null) this.buffer = "";
                this.buffer += cmd;
            }
            return;
        }
        if (/\s/.test(cmd)) {
            this.cleanBuffer();
            // spaces do nothing
        }
        else if (/\d/.test(cmd)) {
            // it's a digit
            if (typeof this.buffer === "string") {
                this.cleanBuffer();
                this.buffer = 0;
            }
            else
                this.buffer = 10 * this.buffer + parseInt(cmd);
        }
        else {
            // Buffer-ending command
            this.cleanBuffer();
            if (cmd in this.commands) {
                this.commandQueue.push(this.commands[cmd]);
            }
            else if (pos != null && cmd in this.fixedTiles) {
                return this.fixedTiles[cmd](pos);
            }
            else if (pos != null && cmd in this.spawners) {
                this.commandQueue.push(pos);
                var rv = this.spawners[cmd](pos);
                // add "machine" tag if it isn't on already
                // (kaplay deduplicates tags automatically)
                rv.push("machine");
                return rv;
            }
            else throw "unknown command " + cmd;
        }
    },
    /**
     * Merge blocks across horizontally in the world to ensure the player won't snag
     * on the edges
     */
    mergeAcross(world) {
        const tw = world.tileWidth();
        const allowedTags = ["wall"/**, "conveyor"/**/];
        for (var y = 0; y < world.numRows(); y++) {
            var prevTile = null;
            var prevTag = null;
            for (var x = 0; x < world.numColumns(); x++) {
                const pos = K.vec2(x, y);
                const thisTile = world.getAt(pos)[0];
                if (
                    prevTile != null
                    && thisTile != null
                    && thisTile.is(prevTag)) {
                    // merge across
                    prevTile.area.offset.x += tw / 2;
                    prevTile.area.scale.x++;
                    thisTile.unuse("area");
                    thisTile.unuse(prevTag);
                }
                else {
                    // reset
                    if (thisTile != null && allowedTags.some(t => thisTile.is(t))) {
                        prevTile = thisTile;
                        prevTag = allowedTags.find(t => thisTile.is(t));
                    }
                    else {
                        prevTile = prevTag = null;
                    }
                }
            }
        }
    },
    /**
     * Reset the buffer at the end of a buffer command.
     */
    cleanBuffer() {
        if (this.buffer !== null) this.commandQueue.push(this.buffer);
        this.buffer = null;
    },
    /**
     * Execute the stored commands in the queue, to initialize the machines.
     */
    build(world) {
        this.cleanBuffer();
        while (this.commandQueue.length > 0) {
            var cmd = this.commandQueue.shift();
            if (typeof cmd === "function")
                cmd.call(this);
            else if (cmd instanceof K.Vec2)
                this.stack.push(...world.getAt(cmd));
            else if (typeof cmd === "string" || typeof cmd === "number")
                this.stack.push(cmd);
            else {
                K.debug.error("bad command", cmd);
                throw new Error("bad command: " + cmd);
            }
        }
        console.log(this.stack);
    },
    /**
     * Queue of commands to be executed to initialize the game.
     */
    commandQueue: [],
    /**
     * Intermediate stack of objects used during initialization.
     */
    stack: [],
    uid() {
        return Math.random().toString(16).slice(2, 10);
    }
};

K.load((async () => {
    var txt = await fetch(WORLD_FILE).then(r => r.text());
    world = K.addLevel(txt.split("\n"), {
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        tiles: {}, // everything is handled by MParser
        pos: K.vec2(64, 64),
        wildcardTile(cmd, pos) {
            try {
                return MParser.process(cmd, pos);
            } catch (e) {
                const at = `line ${pos.y + 1}, col ${pos.x + 1}`;
                const msg = `Tilemap error at ${at}: ${e.stack || e.toString()}`
                K.debug.error(msg);
                K.debug.paused = true;
                throw new SyntaxError(msg);
            }
        }
    }) as GameObj<LevelComp>;

    try {
        MParser.build(world);
        MParser.mergeAcross(world);
    } catch (e) {
        const msg = `Tilemap build error: ${e.stack || e.toString()}`
        K.debug.error(msg);
        K.debug.paused = true;
        throw new Error(msg);
    }


    const playerPositions = world.get("playerPosition")
    if (playerPositions.length == 0) {
        throw new SyntaxError(`need a @ in ${WORLD_FILE}`);
    }
    if (playerPositions.length > 1) {
        console.warn(`Multiple @'s in ${WORLD_FILE} - using the first one`);
    }
    player.pos = playerPositions[0].worldPos();
    playerPositions.forEach(K.destroy);

})());


// Define player
export const player = K.add([
    K.sprite("player"),
    K.layer("player"),
    "player",
    K.pos(0, 0),
    K.area(/**/{
        shape: new K.Polygon([
            K.vec2(0, -TILE_SIZE - 0.5),
            K.vec2(TILE_SIZE / 2, -TILE_SIZE / 2),
            K.vec2(TILE_SIZE / 2, TILE_SIZE / 2),
            K.vec2(-0.1, TILE_SIZE - 0.5),
            K.vec2(0.1, TILE_SIZE - 0.5),
            K.vec2(-TILE_SIZE / 2, TILE_SIZE / 2),
            K.vec2(-TILE_SIZE / 2, -TILE_SIZE / 2),
        ]),
    }/**/),
    K.body({ jumpForce: JUMP_FORCE, maxVelocity: TERMINAL_VELOCITY }),
    K.anchor("center"),
    K.state("normal"),
    infFriction(),
    { // misc functions component
        /**
         * @type {import("kaplay").GameObj<import("kaplay").PosComp>?}
         */
        grabbing: null,
        update() {
            // move the grabbing to self
            if (this.grabbing !== null) {
                if (this.curPlatform() === this.grabbing) this.jump(1); // Reset curPlatform()
                this.grabbing.vel = K.vec2(0); // Reset velocity
                this.grabbing.moveTo(this.worldPos().sub(this.grabbing.parent.worldPos()));
            }
        },
        /**
         * Interaction distance
         */
        intDist: TILE_SIZE * 4,
        /**
         * @param {import("kaplay").GameObj<import("kaplay").PosComp>} target
         * @returns {boolean}
         */
        canTouch(target) {
            // is a UI button?
            if (target.is("ui-button"))
                return true;
            // always gonna be too far?
            const diff = target.worldPos().sub(this.worldPos());
            if (diff.len() > this.intDist)
                return false;
            if (!world)
                return true; // bail if world isn't initialized yet
            const line = new K.Line(this.worldPos(), target.worldPos());
            for (var object of world.get(["area", "tile"])) {
                if (object.isObstacle && object !== target && object !== this.grabbing) {
                    const boundingbox = object.worldArea();
                    if (boundingbox.collides(line)) {
                        return false;
                    }
                }
            }
            return true;
        },
        /**
         * True if overlapping any game object with the tag "type".
         * @param {string} type Tag to check
         * @param {import("kaplay").GameObj} [where=world] 
         * @returns {boolean}
         */
        intersectingAny(type, where = world) {
            return where?.get(type).some(obj => this.isColliding(obj));
        },
        /**
         * Get the currently hovering object, or null.
         * @returns {import("kaplay").GameObj?}
         */
        getTargeted() {
            if (!world)
                return;
            /**
             * @type {import("kaplay").GameObj<import("kaplay").LayerComp>[]}
             */
            const candidates = [];
            for (var obj of world.get("hoverOutline")) {
                if (obj.isHovering() && this.canTouch(obj))
                    candidates.push(obj);
            }
            candidates.sort((a, b) => ((a?.layerIndex ?? 0) - (b?.layerIndex ?? 0)));
            return candidates[0] ?? null;
        }
    },
]);

// set gravity for platformer
K.setGravity(600);

// Keep player centered in window
const follower = player.onUpdate(() => {
    K.camPos(player.worldPos());
});

// Controls
function shouldMoveDown() {
    return K.isButtonDown("move_down") || K.getGamepadStick("left").y < 0;
}
function shouldMoveUp() {
    return K.isButtonDown("move_up") || K.getGamepadStick("left").y > 0;
}
function shouldMoveLeft() {
    return K.isButtonDown("move_left") || K.getGamepadStick("left").x < 0;
}
function shouldMoveRight() {
    return K.isButtonDown("move_right") || K.getGamepadStick("left").x > 0;
}
player.onButtonDown("move_left", () => {
    player.move(-WALK_SPEED, 0);
    player.flipX = false;
});
player.onButtonDown("move_right", () => {
    player.move(WALK_SPEED, 0);
    player.flipX = true;
});
player.onButtonDown("move_up", () => {
    if (player.state === "climbing") player.move(0, -WALK_SPEED);
});
player.onButtonDown("move_down", () => {
    if (player.state === "climbing") player.move(0, WALK_SPEED);
});
player.onGamepadStick("left", xy => {
    if (player.state !== "climbing")
        xy.y = 0;
    player.move(xy.x * WALK_SPEED, xy.y * WALK_SPEED);
    if (xy.x > 0)
        player.flipX = true;
    else if (xy.x < 0)
        player.flipX = false;
});
player.onButtonPress("jump", () => {
    if (player.isGrounded() || player.state === "climbing") {
        player.jump();
        player.enterState("jump");
        if (!player.intersectingAny("button"))
            K.play("jump");
    }
});
player.onButtonPress("climb", () => {
    if (player.state === "climbing") {
        player.enterState("normal");
    }
    else if (player.intersectingAny("ladder")) {
        player.enterState("climbing");
    }
});
player.onButtonPress("throw", () => {
    const thrown = player.grabbing;
    if (!thrown) return;
    var direction = cursor.screenPos().sub(player.screenPos()).scale(SCALE * MAX_THROW_VEL / MAX_THROW_STRETCH);
    const len = direction.len();
    if (len > MAX_THROW_VEL) direction = direction.scale(MAX_THROW_VEL / len);
    player.grabbing = null;
    thrown.applyImpulse(direction);
});


// State functions
player.onStateUpdate("normal", () => {
    if (player.isGrounded() && (shouldMoveLeft() || shouldMoveRight())) {
        if (player.getCurAnim()?.name != "walking") player.play("walking");
    }
    else {
        if (player.getCurAnim()?.name != "idle") player.play("idle");
    }
});
player.onStateEnter("jump", () => {
    player.play("jump", { onEnd() { player.enterState("normal"); } });
});
player.onStateEnter("climbing", () => {
    player.gravityScale = 0;
    player.drag = 1;
    player.mass = Number.MAX_VALUE;
    player.vel = K.vec2(0);
    player.play("climbing");
    player.flipX = false;
    player.grabbing = null; // Drop whatever is being grabbed
});
player.onStateUpdate("climbing", () => {
    if (!player.intersectingAny("ladder")) {
        player.enterState("normal");
    } else if (shouldMoveUp()) {
        player.animSpeed = 1;
    } else if (shouldMoveDown()) {
        player.animSpeed = /*-*/1;
    } else if (shouldMoveLeft() || shouldMoveRight()) {
        player.animSpeed = 1;
    } else {
        player.animSpeed = 0;
    }
});
player.onStateEnd("climbing", () => {
    player.gravityScale = 1;
    player.drag = 0;
    player.animSpeed = 1;
    player.mass = 1;
});

// custom thud, not using thudder component
player.onGround(() => {
    console.log("thud");
    if (!player.intersectingAny("button")) {
        K.play("thud", { detune: -500 });
    }
});


// Footsteps sound effects when walking
var footstepsCounter = 0;
player.onUpdate(() => {
    if (player.state == "normal") footstepsCounter += K.dt() * (+((shouldMoveLeft() || shouldMoveRight()) && player.isGrounded()))
    else if (player.state == "climbing") footstepsCounter += K.dt() * (+(shouldMoveLeft() || shouldMoveRight() || shouldMoveUp() || shouldMoveDown()))
    if (footstepsCounter >= FOOTSTEP_INTERVAL) {
        footstepsCounter = 0;
        K.play("bap", BAP_OPTS[player.state]?.());
    }
});

/* -------- Cursor for interaction ------------- */

const cursor = K.add([
    K.pos(),
    K.fixed(),
    K.sprite("cursor"),
    "cursor",
    K.anchor("center"),
    K.layer("ui"),
    K.color(),
    K.area({ scale: 0 }), // single point
    K.fakeMouse(),
    {
        clampPos() {
            // make sure cursor doesn't go outside of window (prevent "I lost my mouse!!!"")
            this.pos.x = Math.max(0, Math.min(this.pos.x, K.width()));
            this.pos.y = Math.max(0, Math.min(this.pos.y, K.height()));
        },
        showInteractable() {
            // show interaction distance indicator
            const targeted = player.getTargeted();
            if (targeted !== null) {
                this.frame = 0;
                // this.area.scale = K.wave(0.8, 1.2, K.time());
            }
            else {
                // frame 1 is a little smaller and gray
                this.frame = 1;
                // this.area.scale = 1;
            }
        },
        update() {
            this.clampPos();
            this.showInteractable();
        }
    },
]);
// right stick moves cursor
K.setCursor("none");
cursor.onGamepadStick("right", xy => {
    cursor.move(xy);
    cursor.update();
});
K.onMouseMove(() => {
    cursor.update();
    if (cursor.screenPos().x < player.screenPos().x) player.flipX = false;
    else player.flipX = true;
});
K.onButtonPress("click", () => cursor.press());
K.onButtonRelease("click", () => cursor.release());

/* -------------------- UI --------------------- */

const UI = K.add([K.fixed(), K.layer("ui")]);

const FPSindicator = UI.add([
    K.text("", { size: 8, font: "unscii", color: K.WHITE }), // cSpell: ignore unscii
    K.pos(10, 10),
    K.layer("ui"),
])

K.loop(0.1, () => {
    const fps = 1.0 / K.dt();
    FPSindicator.text = "FPS: " + fps.toFixed(2);
    if (fps < 15) {
        FPSindicator.color = K.RED;
    }
    else if (fps < 20) {
        FPSindicator.color = K.YELLOW;
    }
    else {
        FPSindicator.color = K.GREEN;
    }
});

// K.debug.paused = true;
// K.debug.inspect = true;
// follower.paused = true;

if (!(player.layerIndex < cursor.layerIndex)) K.debug.error("Blooey!");
