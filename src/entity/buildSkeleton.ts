import { BodyComp, EaseFuncs, GameObj } from "kaplay";
import { K } from "../context";
import { DistanceCompPlus } from "../context/plugins/kaplay-extradistance";
import { EntityBoneConstraintOptData, EntityModelBoneData, EntityModelTentacleData } from "../DataPackFormat";
import { addRenderComps } from "../draw/primitive";
import * as GameManager from "../GameManager";
import { addPhysicsComponents } from "../physics/addComponents";
import { entitywrapper } from "./comps/entitywrapper";
import { naturalDirection } from "./comps/naturaldirection";
import { speechBubble } from "./comps/speechBubble";
import { BoneComponents, BonesMap, Entity, EntityComponents } from "./Entity";

export function buildHitbox(e: Entity, rootObj: GameObj<EntityComponents>) {
    const { physics, behavior } = e.getPrototype();
    if (physics) addPhysicsComponents(rootObj, physics, false, behavior?.jumpForce);
}

function buildTentacle(e: Entity, map: BonesMap, tentacle: EntityModelTentacleData, constraintEntries: { c: EntityBoneConstraintOptData, t: string }[]) {
    var prev: GameObj<BoneComponents | BodyComp> = map[tentacle.bone] as any;
    var pos = tentacle.pos ? K.Vec2.deserialize(tentacle.pos) : K.Vec2.ZERO;
    for (var k = 0; k < tentacle.n; k++) {
        const sz = K.lerp(tentacle.sizes[0], tentacle.sizes[1], (K.easings[tentacle.sizes[2]! as EaseFuncs] ?? K.easings.linear)(k / tentacle.n));
        const mass = K.lerp(tentacle.masses[0], tentacle.masses[1], (K.easings[tentacle.masses[2]! as EaseFuncs] ?? K.easings.linear)(k / tentacle.n));
        prev = K.add([
            e.id,
            e.kind,
            "tentacle",
            entitywrapper(e),
            K.pos(pos.add(e.obj!.pos)),
            K.rotate(0),
            K.scale(),
            K.area({
                collisionIgnore: [e.id, ...(e.obj?.collisionIgnore ?? [])],
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
                length: tentacle.lps,
                p1: K.Vec2.ZERO,
                p2: k > 0 ? K.Vec2.ZERO : pos,
                drawOpts: {
                    width: sz,
                },
                alpha: tentacle.alpha,
                beta: tentacle.beta
            }),
            K.chainmovable(),
        ]);
        if (tentacle.gravityIsLocal) {
            prev.gravityScale = 0;
            prev.use({
                fixedUpdate(this: GameObj<BodyComp>) {
                    const v = K._k.game.gravity!.clone();
                    K.Vec2.scale(v, K.dt() * this.mass, v);
                    K.Vec2.rotateByAngle(v, K.deg2rad(this.transform.getRotation()), v);
                    K.Vec2.add(this.vel, v, this.vel);
                }
            });
        }
        if (tentacle.render) {
            addRenderComps(prev, prev.id, e.id, tentacle.render as any);
            Object.assign((prev as any as GameObj<DistanceCompPlus>).drawOpts, {
                join: tentacle.render?.join,
                opacity: tentacle.render?.opacity,
                cap: tentacle.render?.cap,
                miterLimit: tentacle.render?.miterLimit,
            });
        }
        if (!prev.has("layer")) prev.use(K.layer(GameManager.getDefaultValue("entityLayer")))
        pos = pos.add((tentacle.extendDir ? K.Vec2.deserialize(tentacle.extendDir).unit() : K.DOWN).scale(tentacle.lps));
        map[tentacle.name + k] = prev;
        if (tentacle.eachConstraint) {
            constraintEntries.push({ c: tentacle.eachConstraint, t: tentacle.name + k });
        }
    }
    if (tentacle.cord) {
        prev.unuse("chainmovable");
    }
    if (tentacle.endConstraint) {
        constraintEntries.push({ c: tentacle.endConstraint, t: tentacle.name + (tentacle.n - 1) });
    }
}

export function buildSkeleton(e: Entity, rootObj: GameObj<EntityComponents>): BonesMap {
    const map: BonesMap = {};
    const model = e.getPrototype().model;
    if (!model) return {};
    const constraintEntries: { c: EntityBoneConstraintOptData, t: string }[] = [];
    const ikEntries: { s: string, t: string, d: number }[] = [];
    const buildBone = (parent: GameObj, bonesList: EntityModelBoneData[]) => {
        for (var bone of bonesList) {
            const obj = parent.add([
                e.id,
                e.kind,
                "bone",
                entitywrapper(e),
                K.pos(),
                K.rotate(0),
                K.scale(1, 1),
                K.skew(0, 0),
                K.offscreen({ hide: true }),
            ]);
            if (bone.pos) obj.moveTo(bone.pos.x, bone.pos.y);
            if (!bone.name) bone.name = "_b" + obj.id;
            if (bone.sensor) {
                obj.use(K.area({ shape: new K.Rect(K.vec2(-0.5), 1, 1), isSensor: true }));
                e.sensors.add(bone.name);
            }
            obj.use(K.named(bone.name));
            map[bone.name] = obj as any;
            if (bone.constraint) {
                constraintEntries.push({ c: bone.constraint, t: bone.name });
            }
            if (bone.render) {
                addRenderComps(obj, obj.id, e.id, bone.render);
                if (!obj.has("layer")) obj.use(K.layer(GameManager.getDefaultValue("entityLayer")));
            }
            if (bone.ik?.angleRange) {
                const [min, max] = bone.ik.angleRange;
                obj.use(K.constraint.bone(min, max));
            }
            if (bone.ik?.naturalDirection) {
                obj.use(naturalDirection(bone.ik.naturalDirection));
            }
            if (bone.ik?.target) {
                ikEntries.push({ s: bone.name, t: bone.ik.target[0], d: bone.ik.target[1] });
            }
            // todo: Physics components on bones
            if (bone.children) {
                buildBone(obj, bone.children);
            }
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
        const target = assertGet(c.t);
        switch (c.c[0]) {
            case "angle": {
                const [_, src, scale, offset] = c.c;
                target.use(K.constraint.rotation(assertGet(src), { scale, offset }));
            } break;
            case "distance": {
                const [_, src, distance, bounds] = c.c;
                target.use(K.constraint.distance(assertGet(src), {
                    distance,
                    mode: (["minimum", "equal", "maximum"] as const)[bounds + 1]!
                }));
            } break;
            case "offset": {
                const [_, src, p] = c.c;
                target.use(K.constraint.translation(assertGet(src), { offset: K.Vec2.deserialize(p) }));
            } break;
            case "scale": {
                const [_, src] = c.c;
                target.use(K.constraint.scale(assertGet(src), {}));
            } break;
            default:
                c.c satisfies never;
        }
    }
    // why it breaks if I put this before the constraint entries, I have no clue.
    for (var i of ikEntries) {
        assertGet(i.s).use(K.constraint.ik(assertGet(i.t), { algorithm: "CCD", depth: i.d }));
    }
    if (model.speechBubble) {
        const { origin, tokenDelay, width, voiceSound } = model.speechBubble;
        e.speechBubble = assertGet(origin) as any;
        e.speechBubble!.use(speechBubble({ tokenDelay }));
        e.speechBubble!.width = width ?? GameManager.getDefaultValue("speechBubbleWidth");
        e.speakSound = voiceSound;
    } else {
        e.speechBubble = <any>e.obj;
        e.speechBubble!.use(speechBubble());
        e.speechBubble!.width = GameManager.getDefaultValue("speechBubbleWidth");
    }
    e.speechBubble!.use(K.layer(GameManager.getDefaultValue("speechBubbleLayer")))
    return map;
}
