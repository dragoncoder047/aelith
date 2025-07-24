import { AreaComp, BodyComp, Comp, GameObj, PosComp, RectComp, Tag, UVQuadComp, Vec2 } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";

export interface CrossoverComp extends Comp {
    colliding: {
        horizontal: Set<GameObj>
        vertical: Set<GameObj>
    }
}

type Axis = "horizontal" | "vertical";
interface CrossoverHelperComp extends Comp {
    otherDir: Axis;
    passDir: Axis;
    main: GameObj<AreaComp | CrossoverComp>;
    posGet: () => Vec2;
    szGet: () => Vec2;
    amount: number;
    t: number;
    showStripes: boolean;
}

function passthroughHelper(
    main: GameObj<AreaComp | CrossoverComp>,
    otherDir: Axis,
    passDir: Axis,
    posGet: () => Vec2,
    szGet: () => Vec2): CrossoverHelperComp {
    var oldShow = false;
    return {
        id: "passthroughHelper",
        require: ["body", "area"],
        otherDir,
        passDir,
        main,
        posGet,
        szGet,
        amount: 0,
        t: K.time(),
        set showStripes(v: boolean) {
            if (oldShow === v) return;
            oldShow = v;
            if (v) {
                this.t = 0;
                K.tween(this.amount, 1, .5, x => this.amount = x, K.easings.easeOutBounce);
            } else {
                K.tween(this.amount, 0, this.amount / 2, x => this.amount = x);
            }
        },
        add(this: GameObj<BodyComp | AreaComp | CrossoverHelperComp>) {
            this.use(K.shader("stripedoor", () => {
                const nspikes = this.szGet()[this.passDir === "vertical" ? "x" : "y"] * (NUM_SPIKES_PER_TILE / TILE_SIZE);
                return {
                    u_time: this.t + this.amount * nspikes / 2,
                    u_angle: this.passDir === "vertical" ? Math.PI / 2 : 0,
                    u_color: K.WHITE.darken(30),
                    u_num_spikes: nspikes,
                    u_amount: this.amount,
                };
            }));
            this.onBeforePhysicsResolve(coll => {
                const objs = [coll.target];
                if (coll.target === player || player.inventory.includes(coll.target as any)) {
                    objs.push(...player.inventory);
                }
                objs.forEach(o => {
                    if (o.isStatic) return;
                    if (this.main.colliding[this.otherDir].has(o)) return;
                    if (this.main.colliding[this.passDir].has(o)) {
                        coll.preventResolution();
                    } else if (!this.main.colliding[this.passDir].has(o)) {
                        this.main.colliding[this.passDir].add(o);
                        this.main.colliding[this.otherDir].delete(o);
                        coll.preventResolution();
                    } else if (!this.main.colliding[this.otherDir].has(o)) {
                        this.main.colliding[this.otherDir].add(o);
                        this.main.colliding[this.passDir].delete(o);
                    }
                });
            });
            this.onCollideEnd(obj => {
                const objs = [obj];
                if (obj === player || player.inventory.includes(obj as any)) {
                    objs.push(...player.inventory);
                }
                objs.forEach(o => {
                    if (!this.main.isColliding(o as any)) {
                        this.main.colliding[this.passDir].delete(o);
                        this.main.colliding[this.otherDir].delete(o);
                    }
                });
            });
        },
        update(this: GameObj<UVQuadComp | PosComp | AreaComp | CrossoverHelperComp>) {
            const { x: width, y: height } = this.szGet();
            this.width = width;
            this.height = height;
            this.pos = this.posGet();
            this.collisionIgnore = this.main.collisionIgnore;
            this.friction = this.main.friction;
            this.restitution = this.main.restitution;
            this.paused = this.main.paused;
            if (this.amount === 1) this.t += K.dt();
        },
        inspect() {
            return "passDir: " + this.passDir;
        },
        draw(this: GameObj<CrossoverHelperComp>) {
            this.hidden = this.main.hidden;
        }
    }
}

const HELPER_THICKNESS = TILE_SIZE / 4;
const NUM_SPIKES_PER_TILE = 3;

export function crossover(): CrossoverComp {
    var detectors: GameObj<CrossoverHelperComp>[] = [];
    return {
        id: "crossover",
        require: ["area", "body", "pos"],
        colliding: {
            horizontal: new Set,
            vertical: new Set,
        },
        add(this: GameObj<AreaComp | PosComp | BodyComp | RectComp | CrossoverComp>) {
            this.use(K.anchor("center"));
            detectors.push(this.add([
                K.area(),
                K.pos(),
                K.anchor("right"),
                K.uvquad(0, 0),
                K.body({ isStatic: true }),
                passthroughHelper(this, "vertical", "horizontal",
                    () => K.vec2(-this.width / 2, 0),
                    () => K.vec2(HELPER_THICKNESS, this.height)),
                "raycastIgnore" as Tag,
            ]));
            detectors.push(this.add([
                K.area(),
                K.pos(K.vec2(this.width / 2, 0)),
                K.anchor("left"),
                K.uvquad(0, 0),
                K.body({ isStatic: true }),
                passthroughHelper(this, "vertical", "horizontal",
                    () => K.vec2(this.width / 2, 0),
                    () => K.vec2(HELPER_THICKNESS, this.height)),
                "raycastIgnore" as Tag,
            ]));
            detectors.push(this.add([
                K.area(),
                K.pos(),
                K.anchor("bot"),
                K.uvquad(0, 0),
                K.body({ isStatic: true }),
                passthroughHelper(this, "horizontal", "vertical",
                    () => K.vec2(0, -this.height / 2),
                    () => K.vec2(this.width, HELPER_THICKNESS)),
                "raycastIgnore" as Tag,
            ]));
            detectors.push(this.add([
                K.area(),
                K.pos(),
                K.anchor("top"),
                K.uvquad(0, 0),
                K.body({ isStatic: true }),
                passthroughHelper(this, "horizontal", "vertical",
                    () => K.vec2(0, this.height / 2),
                    () => K.vec2(this.width, HELPER_THICKNESS)),
                "raycastIgnore" as Tag,
            ]));
            this.onBeforePhysicsResolve(coll => {
                if (this.colliding.horizontal.has(coll.target)) coll.preventResolution();
                if (this.colliding.vertical.has(coll.target)) coll.preventResolution();
            });
            this.onCollideEnd(obj => {
                this.colliding.horizontal.delete(obj);
                this.colliding.vertical.delete(obj);
            });
        },
        update(this: GameObj) {
            detectors.forEach(d => d.paused = this.paused);
        },
        draw(this: GameObj<CrossoverComp | RectComp>) {
            detectors.forEach(d => d.hidden = this.hidden);
            const lh = this.colliding.horizontal.size;
            const lv = this.colliding.vertical.size;
            // shown if: something colliding and shown for this direction
            detectors.forEach(d => d.showStripes = (lh > 0 || lv > 0) && (lh > lv) === (d.passDir === "vertical"));
        },
        destroy() {
            detectors.forEach(d => d.destroy());
        }
    }
}
