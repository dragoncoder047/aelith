import { AreaComp, CompList, GameObj, LevelComp, PosComp, RotateComp, Tag, Vec2 } from "kaplay";
import { InvisibleTriggerComp } from "../components/invisibleTrigger";
import { LinkComp } from "../components/linked";
import { MergeableComp } from "../components/mergeable";
import { TogglerComp } from "../components/toggler";
import { FONT_SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { antivirus } from "../object_factories/antivirus";
import { barrier } from "../object_factories/barrier";
import { box } from "../object_factories/box";
import { brokenLadder } from "../object_factories/brokenLadder";
import { bugger } from "../object_factories/bugger";
import { button } from "../object_factories/button";
import { checkpoint } from "../object_factories/checkpoint";
import { continuationTrap } from "../object_factories/continuationTrapGun";
import { conveyor } from "../object_factories/conveyor";
import { crossing } from "../object_factories/crossing";
import { dataPipe } from "../object_factories/dataPipe";
import { door } from "../object_factories/door";
import { fan } from "../object_factories/fan";
import { grating } from "../object_factories/grating";
import { invisibleTrigger } from "../object_factories/invisibleTrigger";
import { ladder } from "../object_factories/ladder";
import { lever } from "../object_factories/lever";
import { light } from "../object_factories/light";
import { onetimeCushion } from "../object_factories/onetimeCushion";
import { playerPosition } from "../object_factories/playerPosition";
import { popupTextNote } from "../object_factories/popupText";
import { rightDestroyBarrier } from "../object_factories/rightDestroyBarrier";
import { specialGrating } from "../object_factories/specialGrating";
import { textNote } from "../object_factories/text";
import { trapdoor } from "../object_factories/trapdoor";
import { vacuum } from "../object_factories/vacuum";
import { wall } from "../object_factories/wall";
import { windEnd } from "../object_factories/windEnd";
import { PlayerBodyComp } from "../player/body";

/**
 * Main parser handler for level map data (in WORLD_FILE).
 */
export const MParser: {
    pausePos: Vec2
    world: GameObj<LevelComp | PosComp> | undefined
    spawners: { [x: string]: (this: typeof MParser) => CompList<any>; }
    fixedTiles: { [x: string]: (this: typeof MParser) => CompList<any>; }
    commands: { [x: string]: (this: typeof MParser) => void; }
    buffer: string | number | undefined
    parenStack: string[]
    vars: { [x: string]: any; }
    commandQueue: (string | number | Vec2 | ((this: typeof MParser) => void))[]
    stack: any[]
    merge(): void
    process(cmd: string, pos?: Vec2): CompList<any> | undefined
    cleanBuffer(): void
    build(): void
    preprocess(): void
    midprocess(): void
    postprocess(): void
    uid_counter: number
    uid(): string
    pauseWorld(paused: boolean): void
} = {
    pausePos: K.vec2(0),
    world: undefined,
    // MARK: spawners
    /**
     * Commands that spawn a machine at that particular location.
     */
    spawners: {
        A: checkpoint,
        B: button,
        C: conveyor,
        D: door, // E
        F: fan, // G, H
        I: invisibleTrigger, // J, K
        L: light,
        M: popupTextNote,
        N: textNote, // O, P, Q
        R: bugger,
        S: lever,
        T: continuationTrap,
        U: trapdoor,
        V: antivirus,
        W: windEnd,
        X: box,
        Y: vacuum, // Z
    },
    // MARK: fixedTiles
    /**
     * Commands that spawn a tile that isn't configurable.
     */
    fixedTiles: {
        "@": playerPosition,
        "#": wall,
        "%": barrier,
        "$": grating,
        "!": specialGrating,
        "<": rightDestroyBarrier,
        "=": ladder,
        "~": brokenLadder,
        "&": crossing,
        "_": onetimeCushion,
        "+": () => dataPipe(true),
        "-": () => dataPipe(false),
        ":": () => dataPipe(false, false)
    },
    vars: {},
    // MARK: commands
    /**
     * Parser commands that are executed post-world-creation
     * to initialize the machines.
     */
    commands: {
        // MARK: z (ndrop)
        // drop/done command: things* n? --
        z() {
            const howmany = this.stack.pop();
            if (typeof howmany === "number") {
                for (var i = 0; i < howmany; i++) {
                    const obj = this.stack.pop();
                    if (typeof obj?.finish === "function") obj.finish();
                }
            }
            else if (typeof howmany?.finish === "function") howmany.finish();
        },
        // MARK: n(egate)
        // negate command: number -- number
        n() {
            this.stack.push(-(this.stack.pop() as number));
        },
        // MARK: s(et)
        // set property: obj pName value -- obj
        s() {
            const value = this.stack.pop();
            const propName = this.stack.pop() as string;
            const obj = this.stack.pop();
            // K.debug.log(`Setting ${propName} on ${obj.tags} to ${value}`);
            obj[propName] = value;
            this.stack.push(obj);
        },
        // MARK: r(otate)
        // rotate by degrees: obj degrees -- obj
        r() {
            const degrees = this.stack.pop() as number;
            const object = this.stack.pop() as GameObj<RotateComp>;
            object.angle += degrees;
            this.stack.push(object);
        },
        // MARK: m(ove)
        // move: obj x y -- obj
        m() {
            const y = this.stack.pop() as number;
            const x = this.stack.pop() as number;
            const obj = this.stack.pop() as GameObj<PosComp>;
            obj.pos = obj.pos.add(K.vec2(x, y));
            this.stack.push(obj);
        },
        // MARK: g(roup)
        // group command: oN ... o3 o2 o1 number id? -- oN ... o3 o2 o1
        g() {
            var n = this.stack.pop() as number | string;
            var link = this.uid();
            if (typeof n === "string") {
                link = n;
                n = this.stack.pop() as number;
            };
            for (var i = 0; i < n; i++) {
                var item = this.stack.at(-1 - i) as GameObj<LinkComp>;
                item.linkGroup = link;
            }
        },
        // MARK: d(efine)
        // define command: value name --
        d() {
            const pName = this.stack.pop() as string;
            const pContent = this.stack.pop() as typeof this.vars[string];
            // K.debug.log("define", pName, pContent);
            this.vars[pName] = pContent;
        },
        // MARK: k (get)
        // get command: name -- value
        // couldn't use g cause it's taken already
        k() {
            const pName = this.stack.pop() as string;
            const val = this.vars[pName];
            if (val === undefined)
                throw new ReferenceError("undefined: " + pName);
            this.stack.push(val);
        },
        // MARK: i(nvoke)
        // invoke command: *arguments name -- *values
        i() {
            const pName = this.stack.pop() as string;
            const proc = this.vars[pName];
            if (typeof proc !== "function")
                throw new ReferenceError(pName + " is not a function: " + proc);
            // ops are in reverse order since they go on the front like a backended stack
            this.commandQueue.unshift(() => {
                // pop the scope off
                this.vars = Object.getPrototypeOf(this.vars);
            });
            // do the proc commands
            this.commandQueue.unshift(proc);
            this.commandQueue.unshift(() => {
                // put a new scope on
                this.vars = Object.create(this.vars);
            });
        },
        // MARK: l(oop)
        // loop command: code n -- *anything
        l() {
            const times = this.stack.pop() as number;
            const code = this.stack.pop() as string;
            for (var i = 0; i < times; i++) {
                this.commandQueue.unshift(code);
            }
        },
        // MARK: f(iltered)
        // filtered command: objects* code tag n -- objects*
        f() {
            const n = this.stack.pop() as number;
            const tag = this.stack.pop() as Tag;
            const code = this.stack.pop() as (this: typeof MParser) => void;
            const objects: GameObj[] = [];
            this.commandQueue.unshift(() => {
                while (objects.length > 0) this.stack.push(objects.pop());
            });
            for (var i = 0; i < n; i++) {
                const obj = this.stack.pop() as GameObj;
                objects.push(obj);
                this.commandQueue.unshift(() => {
                    const o = this.stack.pop();
                    if (o === obj) return;
                    // The inside code dropped the object,
                    // we need to mirror this at the end
                    this.stack.push(o);
                    objects.splice(objects.indexOf(obj), 1);
                })
                this.commandQueue.unshift(() => {
                    this.stack.push(obj);
                    if (obj.is(tag)) {
                        this.commandQueue.unshift(code);
                    }
                });
            }
        },
        // MARK: p(artition)
        // partition: objects* partitionStr -- objects*
        p() {
            const partitionString = this.stack.pop() as string;
            const commands = Array.from(partitionString.matchAll(/(\d+)([a-z+]+)/gi));
            const objects: { [group: string]: any[] } = {}
            var lastGroup: any[] = [];
            for (var [_, countStr, group] of commands) {
                const count = parseInt(countStr!);
                if (group === "+") {
                    for (var i = 0; i < count; i++)
                        lastGroup.unshift(lastGroup.at(-1));
                } else {
                    if (!(group! in objects))
                        objects[group!] = [];
                    for (var i = 0; i < count; i++) {
                        const obj = this.stack.pop();
                        objects[group!]!.unshift(obj);
                    }
                    lastGroup = objects[group!]!;
                }
            }
            for (group of Object.keys(objects).sort().reverse()) {
                this.stack.push(...objects[group]!);
            }
        },
        // MARK: t(oggle)
        // toggle command: flips the state of the game object
        t() {
            const obj = this.stack.pop() as GameObj<TogglerComp>;
            obj.togglerState = !obj.togglerState;
            // K.onLoad(() => obj.togglerState = !obj.togglerState);
            this.stack.push(obj);
        },
        // MARK: e(longate)
        // elongate command: stretches the object's area in the specified direction
        // intended to be used for wind tunnels
        e() {
            const mod = this.stack.pop() as string;
            const obj = this.stack.pop() as GameObj<AreaComp | PosComp>;
            const match = /^([+-]?\d+)([+-][xy])$/i.exec(mod);
            if (!match) throw new Error("invalid elongate command " + mod);
            const [_, dir, axis] = match;
            const dirI = parseInt(dir!);
            const move = (axis![0] == "+" ? dirI : -dirI) * TILE_SIZE / 2;
            switch (axis![1]!.toLowerCase()) {
                case "x":
                    obj.area.scale.x += dirI;
                    obj.area.offset.x += move;
                    break;
                case "y":
                    obj.area.scale.y += dirI;
                    obj.area.offset.y += move;
                    break;
                default:
                    throw new Error("BUG: something's wrong with my regex in e() command");
            }
            this.stack.push(obj);
        },
        // MARK: u(id)
        // push a uid
        u() {
            this.stack.push(this.uid());
        },
        // MARK: a (fontsize)
        // fontsize command: size -- pixels
        a() {
            const size = this.stack.pop() as number;
            this.stack.push(size * 8 / FONT_SCALE);
        },
        // MARK: b (tilecount)
        // tilecount command: tiles -- pixels
        b() {
            const size = this.stack.pop() as number;
            this.stack.push(size * TILE_SIZE);
        },
        // MARK: invisible trigger setup command: (I string -- I)
        v() {
            const s = this.stack.pop() as string;
            const obj = this.stack.pop() as GameObj<InvisibleTriggerComp>;
            obj.setup(s);
            this.stack.push(obj);
        },
        // MARK: (s)q(uirrel)
        // squirrel command:
        // name 0 -- obj (pop from stack)
        // obj name 1 -- (push to stack)
        // name 2 -- obj* len (copy all from stack -- doesn't pop)
        q() {
            const op = this.stack.pop() as 0 | 1 | 2;
            const name = this.stack.pop() as string;
            if (!Array.isArray(this.vars[name])) this.vars[name] = [];
            if (op === 1) this.vars[name].push(this.stack.pop());
            else if (op === 2) this.stack.push(...this.vars[name].toReversed(), this.vars[name].length);
            else this.stack.push(this.vars[name].pop());
        },
        // MARK: c(all/cc)
        // *MAGIC!!*
        // function -- value
        // function gets a continuation function on the stack
        // actually this function is rigged to error
        c() {
            (undefined as unknown as () => void)();
            const func = this.stack.pop() as (typeof MParser)["commands"][string];
            const save = {
                stack: this.stack.slice(),
                commands: this.commandQueue.slice(),
                scope: this.vars,
            }
            this.commandQueue.unshift(func); // Run the func when we return
            this.stack.push(() => {
                // This is the function that invokes the continuation
                const invokedWith = this.stack.pop();
                // restore state
                this.stack = save.stack;
                this.commandQueue = save.commands;
                this.vars = save.scope;
                // push the value invoked with
                this.stack.push(invokedWith);
            });
        },
        // MARK: h (math)
        h() {
            const MATH_FUNCS: { [f: string]: (a: number, b: number) => number } = {
                "+": (a, b) => a + b,
                "-": (a, b) => a - b,
                "*": (a, b) => a * b,
                "/": (a, b) => a / b,
            };
            const commands = this.stack.pop() as string;
            for (var ch of commands) {
                const fun = MATH_FUNCS[ch];
                if (fun === undefined) {
                    throw new SyntaxError(`unknown math op '${ch}'`);
                }
                const b = this.stack.pop() as number;
                const a = this.stack.pop() as number;
                this.stack.push(fun(a, b));
            }
        },
        // // MARK: ? (debug)
        // // debug command: logs the top object
        // "?"() {
        //     const object = this.stack.at(-1) as GameObj;
        //     console.log(`${object?.tags} tags`, object);
        // },
        // // MARK: ! (debug)
        // // check length of stack here
        // "!"() {
        //     console.log(this.stack.length, this.stack.slice());
        //     for (var i = 0; i < this.stack.length; i++) {
        //         console.log(i, ":", this.stack[i]?.tags);
        //     }
        // }
    },
    /**
     * Used to hold intermediate parsing results.
     */
    buffer: undefined,
    parenStack: [],
    // MARK: process()
    process(cmd, pos): CompList<any> | undefined {
        const oldLen = this.parenStack.length;
        if (cmd == "[" || cmd == "(" || cmd == "{") {
            this.parenStack.push(cmd);
            if (typeof this.buffer !== "string") this.cleanBuffer(), this.buffer = "";
        }
        if (this.parenStack.length > 0) {
            const popParen = (p: string) => {
                if (!this.parenStack.length) throw new SyntaxError("unmatched paren " + p);
                const oldState = this.parenStack.pop();
                const expected = { "{": "}", "[": "]", "(": ")" }[oldState!];
                if (p != expected) throw new SyntaxError("mismatched parens " + oldState + " " + p);
            };
            if (cmd == "]" || cmd == ")" || cmd == "}") {
                popParen(cmd);
                if (this.parenStack.length === 0) {
                    this.cleanBuffer();
                    if (cmd === ")") {
                        const string = this.commandQueue.pop() as string;
                        this.commandQueue.push(decodeURIComponent(string));
                    }
                    else if (cmd === "}") {
                        const code = this.commandQueue.pop();
                        if (typeof code !== "string") throw new Error("BUG: cleanBuffer() not string!");
                        this.commandQueue.push(() => {
                            // The decoding function
                            this.parenStack = [];
                            this.buffer = undefined;
                            const oLen = this.commandQueue.length;
                            for (var i = 0; i < code.length; i++) this.process(code[i]!);
                            if (this.parenStack.length > 0) throw new Error("BUG: mismatched parens should have been handled by now");
                            if (this.commandQueue.length === oLen && code != "") throw new Error("BUG: Lambda is not empty string but there are no code");
                            const procSource = this.commandQueue.splice(oLen, this.commandQueue.length - oLen);
                            // procSource is the commands of this function
                            this.commandQueue.unshift(() => {
                                // The function that puts the lambda on the stack
                                this.stack.push(() => {
                                    this.commandQueue = procSource.concat(this.commandQueue);
                                });
                            });
                        });
                    } else {
                        // it's a comment; throw it out
                        this.commandQueue.pop();
                    }
                    return;
                }
            }
            if ((oldLen > 0 || this.parenStack.length > 1)) {
                if (typeof this.buffer !== "string") this.cleanBuffer(), this.buffer = "";
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
            if (typeof this.buffer !== "number") this.cleanBuffer(), this.buffer = 0;
            this.buffer = 10 * this.buffer + parseInt(cmd);
        }
        else {
            // Buffer-ending command
            this.cleanBuffer();
            if (cmd in this.commands) {
                this.commandQueue.push(this.commands[cmd]!);
            }
            else if (pos !== undefined && cmd in this.fixedTiles) {
                return this.fixedTiles[cmd]!.call(this);
            }
            else if (pos !== undefined && cmd in this.spawners) {
                this.commandQueue.push(pos);
                var rv = this.spawners[cmd]!.call(this);
                // add "machine" tag if it isn't on already
                // (kaplay deduplicates tags automatically)
                rv.push("machine");
                rv.push(cmd);
                return rv;
            }
            else throw new ReferenceError("unknown command " + cmd);
        }
    },
    // MARK: merge()
    /**
     * Merge blocks across horizontally and/or vertically in the world
     * to ensure the player won't snag on the edges, and to prevent excessive lag
     * from too many game objects.
     * 
     * Uses https://stackoverflow.com/questions/5919298/algorithm-for-finding-the-fewest-rectangles-to-cover-a-set-of-rectangles-without
     */
    merge() {
        const w = this.world!;
        const c2k = (x: number, y: number) => `${x.toString(16)},${y.toString(16)}`;
        const allowedTags = ["wall", "barrier", "conveyor", "grating", "crossover"];
        for (var tag of allowedTags) {
            const tiles: { [pos: string]: GameObj<AreaComp | MergeableComp | PosComp> } = {};
            // get original tiles in a grid
            for (var x = 0; x < w.numColumns(); x++)
                for (var y = 0; y < w.numRows(); y++) {
                    const objs = w.getAt(K.vec2(x, y)) as (typeof tiles[keyof typeof tiles])[];
                    for (var obj of objs)
                        if (obj && obj.has("mergeable") && obj.has("area") && obj.is(tag)) tiles[c2k(x, y)] = obj;
                }
            // do merge algorithm
            // scan grid
            for (var y = 0; y < w.numRows(); y++) {
                for (var x = 0; x < w.numColumns(); x++) {
                    const k = c2k(x, y);
                    const tile = tiles[k];
                    if (!tile) continue;
                    // found tile: stretch it across as far as possible
                    var width = 1;
                    for (var merge_x = x + 1; merge_x < w.numColumns(); merge_x++, width++) {
                        const kk = c2k(merge_x, y);
                        if (tiles[kk]) {
                            tiles[kk].destroy();
                            delete tiles[kk];
                            tile.modifyWidth(TILE_SIZE);
                            tile.moveBy(TILE_SIZE / 2, 0);
                        } else break;
                    }
                    // now stretch downwards
                    downstretchloop:
                    for (var merge_y = y + 1; merge_y < w.numRows(); merge_y++) {
                        // check to see if all squares below are filled
                        for (var thisrow_x = x, i = 0; i < width; thisrow_x++, i++) {
                            const kk = c2k(thisrow_x, merge_y);
                            if (!tiles[kk]) {
                                // done merging
                                break downstretchloop;
                            }
                        }
                        // get here = can merge down
                        for (var thisrow_x = x, i = 0; i < width; thisrow_x++, i++) {
                            const kk = c2k(thisrow_x, merge_y);
                            tiles[kk]?.destroy();
                            delete tiles[kk];
                        }
                        tile.modifyHeight(TILE_SIZE);
                        tile.moveBy(0, TILE_SIZE / 2);
                    }
                }
            }
        }
    },
    // MARK: cleanBuffer()
    /**
     * Reset the buffer at the end of a buffer command.
     */
    cleanBuffer() {
        if (this.buffer !== undefined) this.commandQueue.push(this.buffer);
        this.buffer = undefined;
    },
    // MARK: build()
    /**
     * Execute the stored commands in the queue, to initialize the machines.
     */
    build() {
        this.cleanBuffer();
        while (this.commandQueue.length > 0) {
            var cmd = this.commandQueue.shift();
            if (typeof cmd === "function")
                cmd.call(this);
            else if (cmd instanceof K.Vec2)
                this.stack.push(...this.world!.getAt(cmd));
            else if (typeof cmd === "string" || typeof cmd === "number")
                this.stack.push(cmd);
            else {
                K.debug.error("bad command: " + cmd);
                console.error("bad command", cmd);
                throw new Error("bad command: " + cmd);
            }
        }
    },
    // MARK: postprocess()
    preprocess() {
        this.world!.get("*").forEach(o => o.trigger("preprocess"));
    },
    midprocess() {
        this.world!.get("*").forEach(o => o.trigger("midprocess"));
    },
    postprocess() {
        this.world!.get("*").forEach(o => o.trigger("postprocess"));
    },
    /**
     * Queue of commands to be executed to initialize the game.
     */
    commandQueue: [],
    /**
     * Intermediate stack of objects used during initialization.
     */
    stack: [],
    uid_counter: 10000,
    uid() {
        return (this.uid_counter++).toString(16);
    },
    pauseWorld(paused) {
        this.world!.query({ hierarchy: "descendants" }).forEach(x => x.paused = paused);
        if (!paused) {
            const player = K.get<PlayerBodyComp>("player")[0]!;
            const sign = player.holdingIndex < 0 ? 1 : -1;
            K.eventGroups.add("notReallyChangingInventory");
            player.scrollInventory(sign);
            player.scrollInventory(-sign);
            K.eventGroups.delete("notReallyChangingInventory");
        }
    },
};
