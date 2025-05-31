import { AnchorComp, AreaComp, BodyComp, Comp, GameObj, NamedComp, PosComp, RotateComp, SpriteComp, Vec2 } from "kaplay";
import contTypes from "../assets/trapTypes.json" with { type: "json" };
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { LinkComp } from "./linked";
import { PointTowardsComp } from "./pointTowards";
import { TogglerComp } from "./toggler";


export interface GrabberComp extends Comp {
    which: keyof typeof contTypes | "undefined";
}

const GRABBER_MAX = TILE_SIZE * 4;
const GRABBER_STRETCH = 50000;
const GRABBER_MAX_FORCE = 800;

const THRESHOLD_SQUARED = TILE_SIZE * TILE_SIZE;

export function grabber(): GrabberComp {
    var _force1 = K.vec2(0);
    var _force2 = K.vec2(0);
    return {
        id: "grabber",
        which: "undefined",
        require: ["sprite", "body", "pos", "pointTowards", "toggler"],
        add(this: GameObj<GrabberComp | PosComp | AnchorComp | AreaComp | BodyComp>) {
            this.use(K.shader("recolorRed", () => ({
                u_targetcolor: K.Color.fromHex((contTypes as any)[this.which]?.color ?? "#ff0000"),
            })));
            this.use(K.spring({
                other: this.parent! as any,
                forceOther: false,
                p1: K.vec2(0, 2),
                length: 0,
                p2: this.toOther(this.parent! as any, K.vec2(0, -TILE_SIZE / 2)),
                springConstant: 40,
                springDamping: 100,
                drawOpts: {
                    color: K.Color.fromHex("#666666"),
                    width: 4,
                }
            }));
            this.on("postprocess", () => {
                this.anchor = "top";
                this.area.scale = K.vec2(0.25);
            });
        },
        fixedUpdate(this: GameObj<BodyComp | GrabberComp | PointTowardsComp | PosComp | SpriteComp | RotateComp | TogglerComp | LinkComp>) {
            const lookingFor = K.get<NamedComp | PosComp | BodyComp>("continuationTrap", { recursive: true })
                .find(o => o.name === this.which && !o.hidden);
            const goState = (state: boolean) => {
                if (state !== this.togglerState) {
                    this.broadcast(this.toggleMsg);
                }
            }
            if (!lookingFor) {
                this.play("dormant", { preventRestart: true });
                goState(false);
                this.pointingTowards = null;
                return;
            }
            const off = lookingFor.worldPos()!.sub(this.worldPos()!);
            if (off.slen() > GRABBER_MAX * GRABBER_MAX) {
                this.play("dormant", { preventRestart: true });
                goState(false);
                this.pointingTowards = null;
                return;
            }
            this.play("grabbing", { preventRestart: true });
            this.pointingTowards = lookingFor;
            var forceRaw = clampLen(off.unit().scale(GRABBER_STRETCH / off.len()), GRABBER_MAX_FORCE);
            _force1 = forceRaw.rotate(-this.angle);
            _force2 = forceRaw.scale(-1).add(K._k.game.gravity!.scale(-1));
            this.addForce(_force1);
            lookingFor.addForce(_force2);

            goState(off.slen() < THRESHOLD_SQUARED && !player.inventory.includes(lookingFor as any));

            const displacement = lookingFor.worldPos()!.sub(this.worldPos()!).unit();
            this.vel = this.vel.project(displacement).add(this.vel.reject(displacement).scale(0.6));
            lookingFor.vel = lookingFor.vel.project(displacement).add(lookingFor.vel.reject(displacement).scale(0.6));
        },
        drawInspect(this: GameObj<PosComp | GrabberComp | BodyComp | RotateComp>) {
            K.drawLine({
                p1: K.vec2(0),
                p2: _force1,
                color: K.Color.fromHex("#ff0000"),
                width: 2,
            });
            const lookingFor = K.get<NamedComp | PosComp | BodyComp>("continuationTrap", { recursive: true })
                .find(o => o.name === this.which && !o.hidden);
            if (lookingFor) {
                K.pushRotate(-this.angle);
                const p1 = this.fromWorld(lookingFor.pos);
                K.drawLine({
                    p1,
                    p2: p1.add(_force2),
                    color: K.Color.fromHex("#00FF00"),
                    width: 2,
                });
                K.popTransform();
            }
        }
    }
}

function clampLen(v: Vec2, len: number) {
    if (v.slen() > len * len) return v.unit().scale(len);
    return v;
}