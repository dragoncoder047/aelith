import { AreaComp, BodyComp, Comp, GameObj, NamedComp, OpacityComp, PosComp, StateComp, TweenController } from "kaplay";
import trapTypes from "../assets/trapTypes.json";
import { SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { LinkComp } from "./linked";
import { TogglerComp } from "./toggler";
import { ContinuationTrapComp } from "./continuationTrap";

export interface VacuumComp extends Comp {
    which: keyof typeof trapTypes
    nice(obj: GameObj<NamedComp | ContinuationTrapComp>): boolean
}

export function vacuumComp(states = ["off", "on"]): VacuumComp {
    return {
        id: "vacuum",
        require: ["pos", "area", "state", "toggler", "linked"],
        which: "throw",
        add(this: GameObj<PosComp | AreaComp | VacuumComp | TogglerComp | LinkComp | StateComp>) {
            this.onCollide(o => {
                const obj = o as GameObj<NamedComp | AreaComp | OpacityComp | ContinuationTrapComp>;
                if (this.nice(obj)) {
                    if (!this.togglerState) this.broadcast(this.toggleMsg);
                    obj.isConnected = true;
                }
            });
            this.onCollideEnd(o => {
                const obj = o as GameObj<NamedComp | OpacityComp | ContinuationTrapComp>;
                if (this.nice(obj)) {
                    if (this.togglerState) this.broadcast(this.toggleMsg);
                    obj.isConnected = false;
                }
            });
            this.onCollideUpdate(o => {
                const obj = o as GameObj<NamedComp | PosComp | BodyComp | ContinuationTrapComp>;
                if (this.nice(obj)) {
                    if (!obj.has("body")) return;
                    obj.moveTo(this.pos, 100);
                    obj.vel = K.vec2(0);
                }
            });
            this.use(K.shader("vacuum", () => {
                const x = states[0] == this.state ? 1 : 5;
                return {
                    u_targetcolor: K.Color.fromHex(trapTypes[this.which].color),
                    u_time: K.time() * x,
                    u_octave: x * 2,
                    u_staticrand: this.id!,
                    u_pixamt: TILE_SIZE / SCALE * x
                };
            }));
        },
        nice(obj) {
            return obj.name == this.which && obj.enabled && !obj.isDeferring;
        },
    }
}
