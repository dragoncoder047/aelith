import { AreaComp, BodyComp, GameObj, Shape } from "kaplay";
import { K } from "../context";
import { PhysicsComponentData, XY } from "../DataPackFormat";
import * as GameManager from "../GameManager";
import { climbable } from "./climbable";
import { sticky } from "./sticky";

const ORDER: PhysicsComponentData[0][] = ["rect", "circle", "poly", "trace", "noColl", "plat", "surf", "climb", "eff", "mass"];

export function addPhysicsComponents(obj: GameObj, comps: PhysicsComponentData[], addedShape: boolean, jumpForce?: number) {
    comps.sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b));
    if (!obj.has("area")) {
        obj.use(K.area({
            restitution: GameManager.getDefaultValue("restitution"),
            friction: GameManager.getDefaultValue("friction")
        }));
    }
    else {
        obj.restitution = GameManager.getDefaultValue("restitution");
        obj.friction = GameManager.getDefaultValue("friction");
    }
    if (!obj.has("body")) {
        obj.use(K.body({ jumpForce }));
    } else {
        obj.jumpForce = jumpForce;
    }
    for (var comp of comps) {
        switch (comp[0]) {
            case "surf":
                (obj as GameObj<AreaComp>).friction = comp[1];
                (obj as GameObj<AreaComp>).restitution = comp[2];
                if (comp[3] !== undefined || comp[4] !== undefined)
                    obj.use(sticky(comp[3], comp[4]));
                continue;
            case "plat":
                obj.use(K.platformEffector({
                    ignoreSides: [K.UP, K.DOWN, K.LEFT, K.RIGHT].filter(
                        (_, i) => ((comp[1] as number) & (1 << i)))
                }));
                continue;
            case "eff":
                switch (comp[1]) {
                    case "area":
                        obj.unuse("body");
                        obj.use(K.areaEffector({ force: K.Vec2.deserialize(comp[2]) }));
                        break;
                    case "con":
                        obj.use(K.surfaceEffector({ speed: comp[2] }));
                        break;
                    default:
                        comp[1] satisfies never;
                }
                continue;
            case "climb":
                obj.use(climbable());
                obj.tag("climbable");
                obj.unuse("body");
                continue;
            case "static":
                if (!obj.has("body")) throw new Error("static requires solid collider");
                (obj as GameObj<BodyComp>).isStatic = true;
                continue;
            case "mass":
                if (!obj.has("body")) throw new Error("mass requires solid collider");
                (obj as GameObj<BodyComp>).mass = comp[1];
                continue;
            case "noColl":
                (obj as GameObj<AreaComp>).collisionIgnore = comp.slice(1);
                continue;
        }
        if (addedShape)
            throw new Error("shape already defined");
        var _, x, y, w, h;
        var shape: Shape;
        switch (comp[0]) {
            case "rect":
                [_, x, y, w, h] = comp;
                shape = new K.Rect(K.vec2(x, y), w, h);
                break;
            case "circle":
                [_, x, y, w] = comp;
                shape = new K.Circle(K.vec2(x, y), w);
                break;
            case "poly":
                shape = new K.Polygon((comp.slice(1) as XY[]).map(K.Vec2.deserialize));
                break;
            case "trace":
                throw new Error("Implement me after trace PR is merged in KAPLAY");
            default:
                comp[0] satisfies never;
        }
        (obj as GameObj<AreaComp>).area.shape = shape!;
        addedShape = true;
    }
    if (!addedShape) {
        try {
            obj.renderArea();
        }
        catch {
            obj.unuse("body")
            obj.unuse("area");
        }
    }
}
