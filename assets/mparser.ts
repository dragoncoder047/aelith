import { AreaComp, CompList, GameObj, LevelComp, PosComp, SpriteComp, Vec2 } from "kaplay";
import { LinkComp } from "../components/linked";
import K from "../init";
import { box } from '../object_factories/box';
import { button } from "../object_factories/button";
import { conveyor } from "../object_factories/conveyor";
import { ladder } from "../object_factories/ladder";
import { lever } from "../object_factories/lever";
import { light } from '../object_factories/light';
import { playerPosition } from "../object_factories/playerPosition";
import { wall } from "../object_factories/wall";

/**
 * Main parser handler for level map data (in WORLD_FILE).
 */
export const MParser: {
    world: GameObj<LevelComp> | undefined,
    spawners: { [x: string]: (this: typeof MParser) => CompList<any>; };
    fixedTiles: { [x: string]: (this: typeof MParser) => CompList<any>; };
    commands: { [x: string]: (this: typeof MParser) => void; };
    buffer: string | number | undefined;
    parenStack: string[];
    storedProcedures: { [x: string]: string; };
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
            obj.pos = obj.pos.add(K.vec2(x, y));
            this.stack.push(obj);
        },
        // link command: oN ... o3 o2 o1 number id? -- oN ... o3 o2 o1
        $() {
            var n = this.stack.pop();
            var link = this.uid();
            if (typeof n === "string") {
                link = n;
                n = this.stack.pop();
            };
            var off: GameObj<LinkComp>[] = [];
            for (var i = 0; i < n; i++) {
                var item = this.stack.pop() as GameObj<LinkComp>;
                item.tag = link;
                off.push(item);
            }
            while (off.length > 0)
                this.stack.push(off.pop());
        },
        // define command: value name --
        d() {
            var pName = this.stack.pop();
            var pContent = this.stack.pop();
            this.storedProcedures[pName] = pContent;
        },
        // get command: name -- value
        g() {
            var pName = this.stack.pop();
            var val = this.storedProcedures[pName];
            if (val === undefined)
                throw "undefined: " + pName;
            this.stack.push(val);
        },
        // call command: *arguments name -- *values
        c() {
            var pName = this.stack.pop();
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
                        if (typeof code !== "string") throw "oops string";
                        this.commandQueue.push(() => {
                            this.parenStack = [];
                            this.buffer = undefined;
                            const oLen = this.commandQueue.length;
                            for (var i = 0; i < code.length; i++) {
                                this.process(code[i]!);
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

/**
 * helper function for MParser
 */
function stackOp(from: string, to: string): (this: typeof MParser) => void {
    if ([].some.call(from, (ch: string, i: number) => from.indexOf(ch) !== i))
        throw new Error("stack op definition error: duplicate input names: " + from);
    if ([].some.call(to, (ch: string) => from.indexOf(ch) === -1))
        throw new Error("stack op definition error: undefined character in output: " + to);
    const reversedFrom: string[] = [].slice.call(from).reverse();
    return function (this: typeof MParser) {
        const nameMap: { [n: string]: any; } = {};
        for (var c of reversedFrom) {
            nameMap[c] = this.stack.pop();
        }
        for (var c of to) {
            this.stack.push(nameMap[c]);
        }
    };
}
