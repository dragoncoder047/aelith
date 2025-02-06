import { AreaComp, BodyComp, Comp, GameObj, PosComp, RectComp, Tag, Vec2 } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { drawZapLine } from "../utils";

export interface CrossoverComp extends Comp {
    colliding: {
        horizontal: Set<GameObj>
        vertical: Set<GameObj>
    }
}

function passthroughHelper(
    main: GameObj<AreaComp | CrossoverComp | RectComp>,
    otherDir: "horizontal" | "vertical",
    passDir: "horizontal" | "vertical",
    posGet: () => Vec2,
    szGet: () => Vec2): Comp {
    return {
        id: "passthroughHelper",
        require: ["body", "area"],
        add(this: GameObj<BodyComp | AreaComp>) {
            this.onBeforePhysicsResolve(coll => {
                const obj = coll.target;
                if (main.colliding[otherDir].has(obj)) {
                    return;
                }
                if (main.colliding[passDir].has(obj)) {
                    coll.preventResolution();
                } else if (!main.colliding[passDir].has(obj)) {
                    main.colliding[passDir].add(obj);
                    main.colliding[otherDir].delete(obj);
                    coll.preventResolution();
                } else if (!main.colliding[otherDir].has(obj)) {
                    main.colliding[otherDir].add(obj);
                    main.colliding[passDir].delete(obj);
                }
            });
            this.onCollideEnd(obj => {
                if (!main.isColliding(obj as any)) {
                    main.colliding[passDir].delete(obj);
                    main.colliding[otherDir].delete(obj);
                }
            });
        },
        update(this: GameObj<RectComp | PosComp | AreaComp>) {
            const { x: width, y: height } = szGet();
            this.width = width;
            this.height = height;
            this.pos = posGet();
            this.collisionIgnore = main.collisionIgnore;
            this.friction = main.friction;
            this.restitution = main.restitution;
        }
    }
}

export function crossover(): CrossoverComp {
    var detectors: GameObj[] = [];
    return {
        id: "crossover",
        require: ["area", "body", "pos"],
        colliding: {
            horizontal: new Set,
            vertical: new Set,
        },
        add(this: GameObj<AreaComp | PosComp | BodyComp | RectComp | CrossoverComp>) {
            this.use(K.anchor("center"));
            detectors.push(K.add([
                K.area(),
                K.pos(),
                K.anchor("right"),
                K.rect(0, 0),
                K.opacity(0),
                K.offscreen({ hide: true }),
                K.body({ isStatic: true }),
                passthroughHelper(this, "vertical", "horizontal",
                    () => this.pos.sub(K.vec2(this.width / 2, 0)),
                    () => K.vec2(TILE_SIZE, this.height)),
                "raycastIgnore" as Tag,
            ]));
            detectors.push(K.add([
                K.area(),
                K.pos(this.pos.add(K.vec2(this.width / 2, 0))),
                K.anchor("left"),
                K.rect(0, 0),
                K.opacity(0),
                K.offscreen({ hide: true }),
                K.body({ isStatic: true }),
                passthroughHelper(this, "vertical", "horizontal",
                    () => this.pos.add(K.vec2(this.width / 2, 0)),
                    () => K.vec2(TILE_SIZE, this.height)),
                "raycastIgnore" as Tag,
            ]));
            detectors.push(K.add([
                K.area(),
                K.pos(),
                K.anchor("bot"),
                K.rect(0, 0),
                K.opacity(0),
                K.offscreen({ hide: true }),
                K.body({ isStatic: true }),
                passthroughHelper(this, "horizontal", "vertical",
                    () => this.pos.sub(K.vec2(0, this.height / 2)),
                    () => K.vec2(this.width, TILE_SIZE)),
                "raycastIgnore" as Tag,
            ]));
            detectors.push(K.add([
                K.area(),
                K.pos(),
                K.anchor("top"),
                K.rect(0, 0),
                K.opacity(0),
                K.offscreen({ hide: true }),
                K.body({ isStatic: true }),
                passthroughHelper(this, "horizontal", "vertical",
                    () => this.pos.add(K.vec2(0, this.height / 2)),
                    () => K.vec2(this.width, TILE_SIZE)),
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
        draw(this: GameObj<CrossoverComp | RectComp>) {
            const lh = this.colliding.horizontal.size;
            const lv = this.colliding.vertical.size;
            const w2 = this.width / 2 + TILE_SIZE / 8;
            const h2 = this.height / 2 + TILE_SIZE / 8;
            const tl = K.vec2(-w2, -h2);
            const tr = K.vec2(w2, -h2);
            const bl = K.vec2(-w2, h2);
            const br = K.vec2(w2, h2);
            if (lh > 0 || lv > 0) {
                if (lh > lv) {
                    drawZapLine(tl, tr);
                    drawZapLine(bl, br);
                } else {
                    drawZapLine(tl, bl);
                    drawZapLine(tr, br);
                }
            }
        },
        destroy() {
            detectors.forEach(d => d.destroy());
        }
    }
}
