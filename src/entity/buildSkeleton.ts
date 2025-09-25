import { BodyComp, EaseFuncs, GameObj, PosComp, RotateComp } from "kaplay";
import { K } from "../context";
import { DistanceCompPlus } from "../context/plugins/kaplay-extradistance";
import { EntityBoneConstraintOptData, EntityModelBoneData, EntityModelTentacleData } from "../DataPackFormat";
import { addRenderComps } from "../draw/primitive";
import * as GameManager from "../GameManager";
import { naturalDirection } from "./comps/naturaldirection";
import { BoneComponents, BonesMap, Entity, EntityComp, EntityComponents } from "./Entity";
import { getEntityPrototypeStrict } from "./EntityManager";

export function buildHitbox(e: Entity, rootObj: GameObj<EntityComponents>) {
    const { hitbox, mass, behavior, restitution, friction } = getEntityPrototypeStrict(e.kind);
    if (hitbox) {
        rootObj.use(K.area({
            shape: new K.Polygon(hitbox.map(([x, y]) => K.vec2(x, y))),
            restitution: restitution ?? GameManager.getDefaultValue("restitution"),
            friction: friction ?? GameManager.getDefaultValue("friction")
        }));
        rootObj.use(K.body({ mass, gravityScale: behavior.canFly ? 0 : 1, jumpForce: behavior.jumpForce }));
    }
}

function buildTentacle(e: Entity, map: BonesMap, tentacle: EntityModelTentacleData, constraintEntries: { c: EntityBoneConstraintOptData, t: string }[]) {
    var prev: GameObj<BoneComponents | BodyComp> = map[tentacle.bone] as any;
    var pos = tentacle.pos ? K.vec2(tentacle.pos[0]!, tentacle.pos[1]) : K.Vec2.ZERO;
    for (var k = 0; k < tentacle.n; k++) {
        const sz = K.lerp(tentacle.sizes[0], tentacle.sizes[1], (K.easings[tentacle.sizes[2]! as EaseFuncs] ?? K.easings.linear)(k / tentacle.n));
        const mass = K.lerp(tentacle.masses[0], tentacle.masses[1], (K.easings[tentacle.masses[2]! as EaseFuncs] ?? K.easings.linear)(k / tentacle.n));
        prev = K.add([
            {
                id: "entity",
                get entity() { return e }
            } as EntityComp,
            K.pos(pos.add(e.obj!.pos)),
            K.rotate(0),
            K.scale(),
            K.area({
                collisionIgnore: [e.id],
                restitution: (e.obj as any).restitution ?? GameManager.getDefaultValue("restitution"),
                friction: (e.obj as any).friction ?? GameManager.getDefaultValue("friction"),
                shape: new K.Circle(K.Vec2.ZERO, sz / 2),
            }),
            K.body({
                mass,
                damping: 1
            }),
            K.extradistance({
                other: prev as any,
                moveOther: k !== 0,
                moveSelf: tentacle.cord ? k !== (tentacle.n - 1) : true,
                length: tentacle.lps,
                p1: K.Vec2.ZERO,
                p2: k > 0 ? K.Vec2.ZERO : pos,
                drawOpts: {
                    width: sz,
                }
            }),
        ]);
        if (tentacle.gravityIsLocal) {
            prev.gravityScale = 0;
            prev.use({
                fixedUpdate(this: GameObj<BodyComp | RotateComp>) {
                    this.vel = this.vel.add(K._k.game.gravity!.scale(K._k.app.dt() * this.mass).rotate(this.transform.getRotation()));
                }
            });
        }
        if (tentacle.render) {
            addRenderComps(prev, prev.id, tentacle.render as any);
            Object.assign((prev as any as GameObj<DistanceCompPlus>).drawOpts, {
                join: tentacle.render?.join,
                opacity: tentacle.render?.opacity,
                cap: tentacle.render?.cap,
                miterLimit: tentacle.render?.miterLimit,
            });
        }
        if (!prev.has("layer")) prev.use(K.layer(GameManager.getDefaultValue("entityLayer")))
        pos = pos.add((tentacle.extendDir ? K.vec2(tentacle.extendDir[0], tentacle.extendDir[1]).unit() : K.DOWN).scale(tentacle.lps));
        map[tentacle.name + k] = prev;
        if (tentacle.eachConstraints) {
            constraintEntries.push({ c: tentacle.eachConstraints, t: tentacle.name + k });
        }
    }
    if (tentacle.endConstraints) {
        constraintEntries.push({ c: tentacle.endConstraints, t: tentacle.name + (tentacle.n - 1) });
    }
}

export function buildSkeleton(e: Entity, rootObj: GameObj<EntityComponents>): BonesMap {
    const map: BonesMap = {};
    const model = getEntityPrototypeStrict(e.kind).model;
    const constraintEntries: { c: EntityBoneConstraintOptData, t: string }[] = [];
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
                K.scale(),
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
            // if (bone.name === "gazeTarget") {
            //     obj.use({ update(this: GameObj<PosComp>) { this.worldPos(K.toWorld(K.mousePos())) } })
            // }
        }
    };
    buildBone(rootObj, model.skeleton);
    // build tentacles
    if (model.tentacles) for (var tentacle of model.tentacles) {
        buildTentacle(e, map, tentacle, constraintEntries);
    }
    // -------
    // then install the kinematics constraints
    // (this is to allow nontree and circular references on bones. but who would really want that though)
    const assertGet = (bone: string) => {
        const b = map[bone];
        if (!b) throw new Error(`no such bone ${bone} in skeleton of ${e.kind}`);
        return b;
    }
    for (var c of constraintEntries) {
        const target = map[c.t]!;
        if (c.c.angle) {
            console.log("attaching angle constraint", c.c);
            const [src, scale, offset] = c.c.angle;
            target.use(K.constraint.rotation(assertGet(src), { scale, offset }));
        }
        if (c.c.distance) {
            console.log("attaching distance constraint", c.c);
            const [src, distance, bounds] = c.c.distance;
            target.use(K.constraint.distance(assertGet(src), {
                distance,
                mode: (["minimum", "equal", "maximum"] as const)[bounds + 1]!
            }));
        }
        if (c.c.offset) {
            console.log("attaching offset constraint", c.c);
            const [src, [x, y]] = c.c.offset;
            target.use(K.constraint.translation(assertGet(src), { offset: K.vec2(x, y) }));
        }
        if (c.c.scale) {
            console.log("attaching scale constraint", c.c);
            const [src] = c.c.scale;
            target.use(K.constraint.scale(assertGet(src), {}));
        }
    }
    for (var i of ikEntries) {
        console.log("attaching IK constraint", i);
        map[i.s]!.use(K.constraint.ik(assertGet(i.t), { algorithm: "CCD", depth: i.d }));
    }
    return map;
}
