import { AreaComp, CompList, GameObj, LevelComp, PosComp, RotateComp, SpriteComp, Tag, Vec2 } from "kaplay";
import { LinkComp } from "../components/linked";
import { K } from "../init";

import { box } from "../object_factories/box";
import { button } from "../object_factories/button";
import { conveyor } from "../object_factories/conveyor";
import { fan } from "../object_factories/fan";
import { ladder } from "../object_factories/ladder";
import { lever } from "../object_factories/lever";
import { light } from "../object_factories/light";
import { playerPosition } from "../object_factories/playerPosition";
import { wall } from "../object_factories/wall";
import { windTunnel } from "../object_factories/windTunnel";
import { TogglerComp } from "../components/toggler";
import { TILE_SIZE } from "../constants";
import { door } from "../object_factories/door";

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
    storedProcedures: { [x: string]: string | number | ((this: typeof MParser) => void); };
    commandQueue: (string | number | Vec2 | ((this: typeof MParser) => void))[];
    stack: any[];
    mergeAcross(): void;
    process(cmd: string, pos?: Vec2): CompList<any> | undefined;
    cleanBuffer(): void;
    build(): void;
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
    },
    /**
     * Commands that spawn a tile that isn't configurable.
     */
    fixedTiles: {
        "@": playerPosition,
        "#": wall,
        "=": ladder,
    },
    storedProcedures: {},
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
            if (!(propName in obj)) throw `prop ${propName} don't exist on ${obj} ${obj.tags}`;
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
            const pContent = this.stack.pop() as typeof this.storedProcedures[string];
            this.storedProcedures[pName] = pContent;
        },
        // get command: name -- value
        // couldn't use g cause it's taken already
        k() {
            const pName = this.stack.pop() as string;
            const val = this.storedProcedures[pName];
            if (val === undefined)
                throw "undefined: " + pName;
            this.stack.push(val);
        },
        // invoke command: *arguments name -- *values
        i() {
            const pName = this.stack.pop() as string;
            const proc = this.storedProcedures[pName];
            if (proc === undefined)
                throw "undefined: " + pName;
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
            const commands = Array.from(partitionString.matchAll(/(\d+)([a-z]+)/gi));
            const objects: { [group: string]: GameObj[] } = {}
            for (var [_, countStr, group] of commands) {
                const count = parseInt(countStr!);
                if (!(group! in objects)) objects[group!] = [];
                for (var i = 0; i < count; i++) {
                    const obj = this.stack.pop() as GameObj;
                    objects[group!]!.unshift(obj);
                }
            }
            for (group of Object.keys(objects).sort().reverse()) {
                this.stack.push(...objects[group]!);
            }
        },
        // toggle command: flips the state of the game object
        t() {
            const obj = this.stack.pop() as GameObj<TogglerComp>;
            const zz = obj.onUpdate(() => {
                obj.togglerState = !obj.togglerState;
                zz.cancel();
            });
            this.stack.push(obj);
        },
        // elongate command: stretches the object's area in the specified direction
        // intended to be used for wind tunnels
        e() {
            const mod = this.stack.pop() as string;
            const obj = this.stack.pop() as GameObj<AreaComp | PosComp>;
            const match = /^([+-]?\d+)([+-][xy])$/i.exec(mod);
            if (!match) throw "invalid elongate command " + mod;
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
                    throw "BUG: something's wrong with my regex in e() command";
            }
            this.stack.push(obj);
        },
        // push a uid
        u() {
            this.stack.push(this.uid());
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
        }
        if (this.parenStack.length > 0) {
            const popParen = (p: string) => {
                if (!this.parenStack.length) throw "unmatched paren " + p;
                const oldState = this.parenStack.pop();
                const expected = { "{": "}", "[": "]", "(": ")" }[oldState!];
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
                        if (typeof code !== "string") throw "BUG: cleanBuffer() not string!";
                        this.commandQueue.push(() => {
                            this.parenStack = [];
                            this.buffer = undefined;
                            const oLen = this.commandQueue.length;
                            for (var i = 0; i < code.length; i++) {
                                this.process(code[i]!);
                            }
                            if (this.parenStack.length > 0) throw "BUG: mismatched parens should have been handled by now";
                            if (this.commandQueue.length === oLen && code != "") throw "BUG: Lambda is not empty string but there are no code";
                            const procSource = this.commandQueue.splice(oLen, this.commandQueue.length - oLen);
                            this.commandQueue.unshift(() => {
                                this.stack.push(() => {
                                    this.commandQueue.unshift(() => {
                                        this.storedProcedures = Object.getPrototypeOf(this.storedProcedures);
                                    });
                                    this.commandQueue = procSource.concat(this.commandQueue);
                                    this.commandQueue.unshift(() => {
                                        this.storedProcedures = Object.create(this.storedProcedures);
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
            else throw "unknown command " + cmd;
        }
    },
    /**
     * Merge blocks across horizontally in the world to ensure the player won't snag
     * on the edges
     */
    mergeAcross() {
        const allowedTags = ["wall" /**, "conveyor"/**/];
        for (var y = 0; y < this.world!.numRows(); y++) {
            var prevTile: GameObj<AreaComp | SpriteComp | PosComp> | undefined = undefined;
            var prevTag: string = "";
            for (var x = 0; x < this.world!.numColumns(); x++) {
                const thisTile = this.world!.getAt(K.vec2(x, y))[0]!;
                if (prevTile != undefined
                    && thisTile != undefined
                    && prevTag != ""
                    && thisTile.is(prevTag)) {
                    // merge across
                    prevTile.area.offset.x += this.world!.tileWidth() / 2;
                    prevTile.area.scale.x++;
                    prevTile.transform = K.Mat4.rotateX(0);
                    thisTile.unuse("area");
                    thisTile.unuse(prevTag);
                }
                else {
                    // reset
                    if (thisTile != undefined && allowedTags.some(t => thisTile.is(t))) {
                        prevTile = thisTile as GameObj<AreaComp | SpriteComp | PosComp>;
                        prevTag = allowedTags.find(t => thisTile.is(t))!;
                    }
                    else {
                        prevTile = undefined;
                        prevTag = "";
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
                // @ts-expect-error
                K.debug.error("bad command", cmd);
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
    uid() {
        return Math.random().toString(16).slice(2, 10);
    }
};
