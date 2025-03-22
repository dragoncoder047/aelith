import { AnchorComp, AreaComp, BodyComp, Comp, GameObj, NamedComp, PosComp, RotateComp, SpriteComp, Vec2 } from "kaplay";
import contTypes from "../assets/trapTypes.json" with { type: "json" };
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { SpringComp } from "../plugins/kaplay-springs";
import { LinkComp } from "./linked";
import { PointTowardsComp } from "./pointTowards";
import { TogglerComp } from "./toggler";


export interface GrabberComp extends Comp {
    which: keyof typeof contTypes | "undefined";
}

const GRABBER_MAX = TILE_SIZE * 4;
const GRABBER_STRETCH = 1000000;
const GRABBER_MAX_FORCE = 200;
const GRABBER_MAX_PULL = 800;

const THRESHOLD_SQUARED = TILE_SIZE * TILE_SIZE;

export function grabber(): GrabberComp {
    return {
        id: "grabber",
        which: "undefined",
        require: ["sprite", "body", "pos", "pointTowards", "toggler"],
        add(this: GameObj<GrabberComp | PosComp | AnchorComp | AreaComp>) {
            this.use(K.shader("recolorRed", () => ({
                u_targetcolor: K.Color.fromHex((contTypes as any)[this.which]?.color ?? "#ff0000"),
            })));
            this.use(K.spring({
                other: this.parent! as any,
                forceOther: false,
                p1: K.vec2(0, 2),
                length: 0,
                p2: this.toOther(this.parent! as any, K.vec2(0, -TILE_SIZE / 2)),
                springConstant: 5,
                drawOpts: {
                    color: K.Color.fromHex("#666666"),
                    // @ts-expect-error
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
            if (!lookingFor) {
                this.play("dormant", { restart: false });
                this.pointingTowards = null;
                return;
            }
            const off = lookingFor.worldPos()!.sub(this.worldPos()!);
            if (off.slen() > GRABBER_MAX * GRABBER_MAX) {
                this.play("dormant", { restart: false });
                this.pointingTowards = null;
                return;
            }
            this.play("grabbing", { restart: false });
            this.pointingTowards = lookingFor;
            var force = off.unit().scale(GRABBER_STRETCH / off.len());
            this.addForce(clampLen(force, GRABBER_MAX_FORCE).rotate(-this.angle));
            lookingFor.addForce(clampLen(force, GRABBER_MAX_PULL).scale(-1));

            const targetState = off.slen() < THRESHOLD_SQUARED;
            if (targetState !== this.togglerState) {
                this.broadcast(this.toggleMsg);
            }

            const displacement = lookingFor.worldPos()!.sub(this.worldPos()!).unit();
            this.vel = this.vel.project(displacement).add(this.vel.reject(displacement).scale(0.6));
            lookingFor.vel = lookingFor.vel.project(displacement).add(lookingFor.vel.reject(displacement).scale(0.6));
        }
    }
}

function clampLen(v: Vec2, len: number) {
    if (v.slen() > len * len) return v.unit().scale(len);
    return v;
}