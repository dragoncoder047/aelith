import { AreaComp, CompList, GameObj, LevelComp, PosComp, RotateComp, SpriteComp, Tag, Vec2 } from "kaplay";
import { InvisibleTriggerComp } from "../components/invisibleTrigger";
import { LinkComp } from "../components/linked";
import { MergeableComp } from "../components/mergeable";
import { TogglerComp } from "../components/toggler";
import { FONT_SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { barrier } from "../object_factories/barrier";
import { box } from "../object_factories/box";
import { button } from "../object_factories/button";
import { checkpoint } from "../object_factories/checkpoint";
import { continuationTrap } from "../object_factories/continuationTrapGun";
import { conveyor } from "../object_factories/conveyor";
import { door } from "../object_factories/door";
import { fan } from "../object_factories/fan";
import { invisibleTrigger } from "../object_factories/invisibleTrigger";
import { ladder } from "../object_factories/ladder";
import { lever } from "../object_factories/lever";
import { light } from "../object_factories/light";
import { playerPosition } from "../object_factories/playerPosition";
import { popupTextNote } from "../object_factories/popupText";
import { textNote } from "../object_factories/text";
import { wall } from "../object_factories/wall";
import { windTunnel } from "../object_factories/windTunnel";

/**
 * Main parser handler for level map data (in WORLD_FILE).
 */
export const MParser: {
    world: GameObj<LevelComp | PosComp> | undefined,
    spawners: { [x: string]: (this: typeof MParser) => CompList<any>; };
    fixedTiles: { [x: string]: (this: typeof MParser) => CompList<any>; };
    commands: { [x: string]: (this: typeof MParser) => void; };
    buffer: string | number | undefined;
    parenStack: string[];
    vars: { [x: string]: any; };
    commandQueue: (string | number | Vec2 | ((this: typeof MParser) => void))[];
    stack: any[];
    merge(): void;
    process(cmd: string, pos?: Vec2): CompList<any> | undefined;
    cleanBuffer(): void;
    build(): void;
    uid_counter: number,
    uid(): string;
} = {
    world: undefined,
    /**
     * Commands that spawn a machine at that particular location.
     */
    spawners: {
        L: light,
        S: lever,
        B: button,
        C: conveyor,
        X: box,
        W: windTunnel,
        F: fan,
        D: door,
        N: textNote,
        M: popupTextNote,
        I: invisibleTrigger,
        T: continuationTrap,
        A: checkpoint
    },
    /**
     * Commands that spawn a tile that isn't configurable.
     */
    fixedTiles: {
        "@": playerPosition,
        "#": wall,
        "%": barrier,
        "=": ladder,
    },
    vars: {},
    /**
     * Parser commands that are executed post-world-creation
     * to initialize the machines.
     */
    commands: {
        // drop/done command: things* n? --
        z() {
            const howmany = this.stack.pop();
            if (typeof howmany === "number")
                this.stack.splice(this.stack.length - howmany, howmany);
        },
        // negate command: number -- number
        n() {
            this.stack.push(-(this.stack.pop() as number));
        },
        // set property: obj pName value -- obj
        s() {
            const value = this.stack.pop();
            const propName = this.stack.pop() as string;
            const obj = this.stack.pop();
            // K.debug.log(`Setting ${propName} on ${obj.tags} to ${value}`);
            obj[propName] = value;
            this.stack.push(obj);
        },
        // rotate by degrees: obj degrees -- obj
        r() {
            const degrees = this.stack.pop() as number;
            const object = this.stack.pop() as GameObj<RotateComp>;
            object.angle += degrees;
            this.stack.push(object);
        },
        // move: obj x y -- obj
        m() {
            const y = this.stack.pop() as number;
            const x = this.stack.pop() as number;
            const obj = this.stack.pop() as GameObj<PosComp>;
            obj.pos = obj.pos.add(K.vec2(x, y));
            this.stack.push(obj);
        },
        // group command: oN ... o3 o2 o1 number id? -- oN ... o3 o2 o1
        g() {
            var n = this.stack.pop() as number | string;
            var link = this.uid();
            if (typeof n === "string") {
                link = n;
                n = this.stack.pop() as number;
            };
            const grp: GameObj<LinkComp>[] = [];
            for (var i = 0; i < n; i++) {
                var item = this.stack.pop() as GameObj<LinkComp>;
                item.tag = link;
                grp.push(item);
            }
            while (grp.length > 0)
                this.stack.push(grp.pop());
        },
        // define command: value name --
        d() {
            const pName = this.stack.pop() as string;
            const pContent = this.stack.pop() as typeof this.vars[string];
            // K.debug.log("define", pName, pContent);
            this.vars[pName] = pContent;
        },
        // get command: name -- value
        // couldn't use g cause it's taken already
        k() {
            const pName = this.stack.pop() as string;
            const val = this.vars[pName];
            if (val === undefined)
                throw new ReferenceError("undefined: " + pName);
            this.stack.push(val);
        },
        // invoke command: *arguments name -- *values
        i() {
            const pName = this.stack.pop() as string;
            const proc = this.vars[pName];
            if (proc === undefined)
                throw new ReferenceError("undefined: " + pName);
            this.commandQueue.unshift(proc);
        },
        // loop command: code n -- *anything
        l() {
            const times = this.stack.pop() as number;
            const code = this.stack.pop() as string;
            for (var i = 0; i < times; i++) {
                this.commandQueue.unshift(code);
            }
        },
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
                const obj = this.stack.pop() as GameObj
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
        // toggle command: flips the state of the game object
        t() {
            const obj = this.stack.pop() as GameObj<TogglerComp>;
            obj.togglerState = !obj.togglerState;
            // K.onLoad(() => obj.togglerState = !obj.togglerState);
            this.stack.push(obj);
        },
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
        // push a uid
        u() {
            this.stack.push(this.uid());
        },
        // fontsize command: size -- pixels
        a() {
            const size = this.stack.pop() as number;
            this.stack.push(size * 8 / FONT_SCALE);
        },
        // tilecount command: tiles -- pixels
        b() {
            const size = this.stack.pop() as number;
            this.stack.push(size * TILE_SIZE);
        },
        // invisible trigger setup command: (I string -- I)
        v() {
            const s = this.stack.pop() as string;
            const obj = this.stack.pop() as GameObj<InvisibleTriggerComp>;
            obj.setup(s);
            this.stack.push(s);
        },
        // squirrel command:
        // obj name 1 --
        // name 0 -- obj
        // pushes to stacks
        q() {
            const push = !!this.stack.pop();
            const name = this.stack.pop() as string;
            if (!(name in this.vars)) this.vars[name] = [];
            if (push) this.vars[name].push(this.stack.pop());
            else this.stack.push(this.vars[name].pop());
        },
        // debug command: logs the top object
        "?"() {
            const object = this.stack.pop() as GameObj;
            console.log(`${object.tags} tags`, object);
            this.stack.push(object);
        }
    },
    /**
     * Used to hold intermediate parsing results.
     */
    buffer: undefined,
    parenStack: [],
    process(cmd, pos): CompList<any> | undefined {
        const oldLen = this.parenStack.length;
        if (cmd == "[" || cmd == "(" || cmd == "{") {
            this.parenStack.push(cmd);
            if ((cmd == "(" || cmd == "{") && typeof this.buffer !== "string") this.buffer = "";
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
                if (this.parenStack.length == 0) {
                    if (cmd === ")") {
                        this.cleanBuffer();
                        const string = this.commandQueue.pop() as string;
                        this.commandQueue.push(decodeURIComponent(string));
                    }
                    else if (cmd === "}") {
                        this.cleanBuffer();
                        const code = this.commandQueue.pop();
                        if (typeof code !== "string") throw new Error("BUG: cleanBuffer() not string!");
                        this.commandQueue.push(() => {
                            this.parenStack = [];
                            this.buffer = undefined;
                            const oLen = this.commandQueue.length;
                            for (var i = 0; i < code.length; i++) {
                                this.process(code[i]!);
                            }
                            if (this.parenStack.length > 0) throw new Error("BUG: mismatched parens should have been handled by now");
                            if (this.commandQueue.length === oLen && code != "") throw new Error("BUG: Lambda is not empty string but there are no code");
                            const procSource = this.commandQueue.splice(oLen, this.commandQueue.length - oLen);
                            this.commandQueue.unshift(() => {
                                this.stack.push(() => {
                                    this.commandQueue.unshift(() => {
                                        this.vars = Object.getPrototypeOf(this.vars);
                                    });
                                    this.commandQueue = procSource.concat(this.commandQueue);
                                    this.commandQueue.unshift(() => {
                                        this.vars = Object.create(this.vars);
                                    });
                                });
                            });
                        });
                    }
                    return;
                }
            }
            if ((oldLen > 0 || this.parenStack.length > 1) && this.parenStack[0] !== "[") {
                if (typeof this.buffer !== "string") this.buffer = "";
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
            if (typeof this.buffer !== "number") {
                this.cleanBuffer();
                this.buffer = 0;
            }
            this.buffer = 10 * this.buffer + parseInt(cmd);
        }
        else {
            // Buffer-ending command
            this.cleanBuffer();
            if (cmd in this.commands) {
                this.commandQueue.push(this.commands[cmd]!);
            }
            else if (pos != undefined && cmd in this.fixedTiles) {
                return this.fixedTiles[cmd]!.call(this);
            }
            else if (pos != undefined && cmd in this.spawners) {
                this.commandQueue.push(pos);
                var rv = this.spawners[cmd]!.call(this);
                // add "machine" tag if it isn't on already
                // (kaplay deduplicates tags automatically)
                rv.push("machine");
                rv.push(cmd);
                return rv;
            }
            else throw ReferenceError("unknown command " + cmd);
        }
    },
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
        const allowedTags = ["wall", "barrier", "conveyor"];
        for (var tag of allowedTags) {
            const tiles: { [pos: string]: GameObj<AreaComp | MergeableComp | PosComp> } = {};
            // get original tiles in a grid
            for (var x = 0; x < w.numColumns(); x++)
                for (var y = 0; y < w.numRows(); y++) {
                    const obj = w.getAt(K.vec2(x, y))[0] as typeof tiles[keyof typeof tiles] | undefined;
                    if (obj && obj.is("mergeable") && obj.is(tag)) tiles[c2k(x, y)] = obj;
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
    /**
     * Reset the buffer at the end of a buffer command.
     */
    cleanBuffer() {
        if (this.buffer !== undefined) this.commandQueue.push(this.buffer);
        this.buffer = undefined;
    },
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
                throw new Error("bad command: " + cmd);
            }
        }
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
    }
};
