import { Comp, GameObj, KAPLAYCtx, PosComp, RotateComp, Vec2 } from "kaplay"
import { Body } from "planck"
import type { KAPLAYPlanckPlugin } from "."
export type BodyType = "static" | "kinematic" | "dynamic"

export type P_BodyCompOpt = {
    type: BodyType
    mass?: number
    linearDrag?: number
    angularDrag?: number
    gravityScale?: number
    freezeRotation?: boolean
    bullet?: boolean
}

type CollissionCallback = (obj: GameObj<P_BodyComp>) => void;

export interface P_BodyComp extends Comp {
    body: Body

    angularDrag: number
    angularVelocity: number
    attachedColliderCount: number
    bodyType: BodyType
    centerOfMass: Vec2
    bullet: boolean
    //constraints
    linearDrag: number
    freezeRotation: boolean
    gravityScale: number
    inertia: number
    isKinematic: boolean
    mass: number
    active: boolean
    vel: Vec2
    worldCenterOfMass: Vec2

    addForce(force: Vec2, impulse?: boolean): void
    addForceAtPosition(force: Vec2, position: Vec2, impulse?: boolean): void
    addRelativeForce(force: Vec2, impulse?: boolean): void
    addTorque(torque: number, impulse?: boolean): void

    getPoint(point: Vec2): Vec2
    getRelativePoint(relativePoint: Vec2): Vec2
    getRelativePointVelocity(relativePoint: Vec2): Vec2
    getVector(vector: Vec2): Vec2
    getRelativeVector(relativeVector: Vec2): Vec2

    asleep: boolean

    onCollide(callback: CollissionCallback): void
    onCollideUpdate(callback: CollissionCallback): void
    onCollideEnd(callback: CollissionCallback): void

    jump(force: number): void
}

export function rigidBody(K: KAPLAYCtx & KAPLAYPlanckPlugin) {
    return (opt: P_BodyCompOpt): P_BodyComp => {
        let _body: Body;
        let _colliding: Set<GameObj<P_BodyComp>> = new Set;
        return {
            id: "body",
            require: ["pos", "rotate", "area"],
            get body() { return _body; },
            add(this: GameObj<PosComp | RotateComp | P_BodyComp>) {
                _body = K.physics.world.createBody({
                    type: opt.type || "dynamic",
                    position: K.physics.k2p(this.pos),
                    angle: K.deg2rad(this.angle || 0),
                    linearDamping: opt.linearDrag ?? 0,
                    angularDamping: opt.angularDrag ?? 0,
                    gravityScale: opt.gravityScale ?? 1,
                    fixedRotation: opt.freezeRotation ?? true,
                    bullet: opt.bullet ?? false,
                    userData: this
                });
                // override pos and angle
                Object.defineProperty(this, "pos", {
                    get() {
                        return K.physics.p2k(_body.getPosition());
                    },
                    set(pos) {
                        _body.setPosition(K.physics.k2p(pos));
                    }
                });
                Object.defineProperty(this, "angle", {
                    get() {
                        return K.rad2deg(_body.getAngle());
                    },
                    set(angle) {
                        _body.setAngle(K.deg2rad(angle));
                    }
                });
                // setup events
                this.onCollide(obj => {
                    _colliding.add(obj);
                });
                this.onCollideEnd(obj => {
                    _colliding.delete(obj);
                });
            },
            fixedUpdate(this: GameObj<P_BodyComp>) {
                _colliding.forEach(o => this.trigger("collideUpdate", o));
            },
            destroy() {
                K.physics.world.destroyBody(_body);
            },
            update(this: GameObj<PosComp | RotateComp>) {
                this.pos = K.physics.p2k(_body.getPosition())
                this.angle = K.rad2deg(_body.getAngle())
            },
            /*draw() {
                drawRect({
                    pos: p2k(_body.getPosition()).sub(2,2).sub(this.pos),
                    width: 4,
                    height: 4,
                    angle: this.angle,
                    color: RED,
                })
            },*/
            // Properties
            get angularDrag() { return _body ? _body.getAngularDamping() : 0 },
            set angularDrag(value: number) { _body.setAngularDamping(value) },
            get angularVelocity() { return _body ? _body.getAngularVelocity() : 0 },
            set angularVelocity(value: number) { _body.setAngularVelocity(value) },
            get attachedColliderCount() { return 1 },
            get bodyType() { return _body.getType() as BodyType },
            get centerOfMass() { return K.physics.p2k(_body.getLocalCenter()) },
            get bullet() { return _body.isBullet() },
            get linearDrag() { return _body.getLinearDamping() },
            set linearDrag(value: number) { _body.setLinearDamping(value) },
            get freezeRotation() { return _body.isFixedRotation() },
            set freezeRotation(value: boolean) { _body.setFixedRotation(value) },
            get gravityScale() { return _body.getGravityScale() },
            set gravityScale(value: number) { _body.setGravityScale(value) },
            get inertia() { return _body.getInertia() },
            get isKinematic() { return _body.isKinematic() },
            get mass() { return _body.getMass() },
            get active() { return _body.isActive() },
            set active(value: boolean) { _body.setActive(value) },
            get vel() { return K.physics.p2k(_body.getLinearVelocity()) },
            set vel(value: Vec2) { _body.setLinearVelocity(K.physics.k2p(value)) },
            get worldCenterOfMass() { return K.physics.p2k(_body.getWorldCenter()) },
            // Forces
            addForce(force: Vec2, impulse?: boolean) {
                if (!impulse) {
                    _body.applyForce(K.physics.k2p(force), _body.getPosition())
                }
                else {
                    _body.applyLinearImpulse(K.physics.k2p(force), _body.getPosition())
                }
            },
            addForceAtPosition(force: Vec2, position: Vec2, impulse?: boolean) {
                if (!impulse) {
                    _body.applyForce(K.physics.k2p(force), K.physics.k2p(position))
                }
                else {
                    _body.applyLinearImpulse(K.physics.k2p(force), K.physics.k2p(position))
                }
            },
            addRelativeForce(force: Vec2, impulse?: boolean) {
                if (!impulse) {
                    _body.applyForce(_body.getWorldVector(K.physics.k2p(force)), _body.getPosition())
                }
                else {
                    _body.applyLinearImpulse(_body.getWorldVector(K.physics.k2p(force)), _body.getPosition())
                }
            },
            addTorque(torque: number, impulse?: boolean) {
                if (!impulse) {
                    _body.applyTorque(torque)
                }
                else {
                    _body.applyAngularImpulse(torque)
                }
            },
            // Conversions
            getPoint(point: Vec2) {
                return K.physics.p2k(_body.getLocalPoint(K.physics.k2p(point)))
            },
            getRelativePoint(relativePoint: Vec2) {
                return K.physics.p2k(_body.getWorldPoint(K.physics.k2p(relativePoint)))
            },
            getRelativePointVelocity(relativePoint: Vec2) {
                return K.physics.p2k(_body.getLinearVelocityFromLocalPoint(K.physics.k2p(relativePoint)))
            },
            getVector(vector: Vec2) {
                return K.physics.p2k(_body.getLocalVector(K.physics.k2p(vector)))
            },
            getRelativeVector(relativeVector: Vec2) {
                return K.physics.p2k(_body.getWorldVector(K.physics.k2p(relativeVector)))
            },
            // Sleeping
            get asleep() { return !_body.isAwake() },
            set asleep(v: boolean) { _body.setAwake(!v) },
            // Events
            onCollide(this: GameObj<P_BodyComp>, callback: CollissionCallback) {
                this.on("collide", callback);
            },
            onCollideUpdate(this: GameObj<P_BodyComp>, callback: CollissionCallback) {
                this.on("collideUpdate", callback);
            },
            onCollideEnd(this: GameObj<P_BodyComp>, callback: CollissionCallback) {
                this.on("collideEnd", callback);
            },
            // Platformer
            jump(force: number) {
                this.addForce(K.vec2(0, -force), true)
            }
        }
    };
}
