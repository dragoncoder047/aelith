import { GameObj } from "kaplay";
import { K } from "../context";
import { EntityModelBoneData } from "../DataPackFormat";
import { addRenderComps } from "../draw/primitive";
import * as GameManager from "../GameManager";
import { naturalDirection } from "./comps/naturaldirection";
import { BonesMap, Entity, EntityComp, EntityComponents } from "./Entity";
import { getEntityPrototypeStrict } from "./EntityManager";

export function buildHitbox(e: Entity, rootObj: GameObj<EntityComponents>) {
    const { hitbox, mass, gravityScale } = getEntityPrototypeStrict(e.kind);
    if (hitbox) {
        rootObj.use(K.area({
            shape: new K.Polygon(hitbox.map(([x, y]) => K.vec2(x, y))),
        }));
        rootObj.use(K.body({ mass, gravityScale }));
    }
}

export function buildSkeleton(e: Entity, rootObj: GameObj<EntityComponents>): BonesMap {
    const map: BonesMap = {};
    const model = getEntityPrototypeStrict(e.kind).model;
    const constraintEntries: { c: NonNullable<EntityModelBoneData["constraint"]>, t: string }[] = [];
    const ikEntries: { s: string, t: string, d: number }[] = [];
    // temp fix for kaplayjs/kaplay#899
    K.add([
        K.constraint.scale(K.add(), {}),
    ]).destroy();
    const buildBone = (parent: GameObj, bonesList: EntityModelBoneData[]) => {
        for (var bone of bonesList) {
            const obj = parent.add([
                {
                    id: "entity",
                    get entity() { return e }
                } as EntityComp,
                K.pos(),
                K.rotate(),
                // K.area({ shape: new K.Circle(K.vec2(), 5) }),
            ]);
            if (bone.pos) obj.moveTo(bone.pos[0], bone.pos[1]);
            if (!bone.name) bone.name = "_b" + obj.id.toString(16);
            map[bone.name] = obj;
            if (bone.constraint) {
                constraintEntries.push({ c: bone.constraint, t: bone.name });
            }
            if (bone.render) {
                addRenderComps(obj, obj.id, bone.render);
                if (!obj.has("layer")) obj.use(K.layer(GameManager.getDefaultValue("entityLayer")))
            }
            if (bone.ik?.angleRange) {
                obj.use(K.constraint.bone(bone.ik.angleRange[0], bone.ik.angleRange[1]));
            }
            if (bone.ik?.naturalDirection) {
                obj.use(naturalDirection(bone.ik.naturalDirection));
            }
            if (bone.ik?.target) {
                ikEntries.push({ s: bone.name, t: bone.ik.target[0], d: bone.ik.target[1] });
            }
            if (bone.children) {
                buildBone(obj, bone.children);
            }
        }
    };
    buildBone(rootObj, model.skeleton);
    // TODO: tentacles
    // -------
    // then install the kinematics constraints
    // (this is to allow nontree and circular references on bones. but who would really want that though)
    for (var c of constraintEntries) {
        const target = map[c.t]!;
        if (c.c.angle) {
            console.log("attaching angle constraint", c.c);
            const [src, scale, offset] = c.c.angle;
            target.use(K.constraint.rotation(map[src]!, { scale, offset }));
        }
        if (c.c.distance) {
            console.log("attaching distance constraint", c.c);
            const [src, distance, bounds] = c.c.distance;
            target.use(K.constraint.distance(map[src]!, {
                distance,
                mode: (["minimum", "equal", "maximum"] as const)[bounds + 1]!
            }));
        }
        if (c.c.offset) {
            console.log("attaching offset constraint", c.c);
            const [src, [x, y]] = c.c.offset;
            target.use(K.constraint.translation(map[src]!, { offset: K.vec2(x, y) }));
        }
        if (c.c.scale) {
            console.log("attaching scale constraint", c.c);
            const [src] = c.c.scale;
            target.use(K.constraint.scale(map[src]!, {}));
        }
    }
    for (var i of ikEntries) {
        console.log("attaching IK constraint", i);
        map[i.s]!.use(K.constraint.ik(map[i.t]!, { algorithm: "CCD", depth: i.d }));
    }
    return map;
}
