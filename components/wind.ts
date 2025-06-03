import { AreaComp, AreaEffectorComp, BodyComp, Comp, GameObj, PosComp, RectComp, StateComp, Vec2 } from "kaplay";
import { WALK_SPEED, WIND_FORCE } from "../constants";
import { K } from "../init";
import { WorldManager } from "../levels";
import { PAreaComp } from "../plugins/kaplay-cached-physics";
import { FanComp } from "./fan";
import { LinkComp } from "./linked";
import { TogglerComp } from "./toggler";

export interface WindComp extends Comp {
    windForce: number
    windDirection: number
}

export function wind(direction: number, states: [string, string] = ["off", "on"], fan: GameObj<FanComp>): WindComp {
    var wisps: { pos: Vec2, opacity: number, speed: number }[] = [];
    return {
        id: "wind",
        require: ["areaEffector", "area", "state", "linked", "toggler"],
        windDirection: direction,
        windForce: WIND_FORCE,
        add(this: GameObj<AreaEffectorComp | AreaComp | LinkComp | TogglerComp | WindComp>) {
            this.onCollideUpdate((obj: GameObj) => {
                if (this.windDirection == -90
                    && obj.has(["body", "pos"])
                    && (obj as GameObj<BodyComp>).curPlatform() !== null
                    && this.force.slen() > 0) {
                    (obj as GameObj<PosComp>).move(0, -WALK_SPEED);
                    (obj as GameObj<BodyComp>).jump(Number.EPSILON);
                }
            });
        },
        update(this: GameObj<WindComp | AreaEffectorComp | StateComp<(typeof states)[number]>>) {
            this.force = K.Vec2.fromAngle(this.windDirection).scale(this.windForce * states.indexOf(this.state));
            this.paused = fan.paused;
        },
        draw(this: GameObj<StateComp<(typeof states)[number]> | PAreaComp | RectComp | WindComp | PosComp>) {
            this.hidden = WorldManager.getLevelOf(fan) !== WorldManager.activeLevel?.levelObj;
            if (this.state == states[1]) {
                // draw wind indicators
                const s = this.aabb();
                const maxWisps = s.area() / 1024;
                K.pushMatrix(new K.Mat23);
                for (var i = 0; i < wisps.length; i++) {
                    const x = wisps[i]!;
                    if (x.opacity <= 0 || !s.contains(x.pos)) {
                        wisps.splice(i, 1);
                        i--;
                        continue;
                    }
                    var p = x.pos, a = K.Vec2.fromAngle(this.windDirection).scale(x.speed);
                    for (var w = 0; w < x.opacity && s.contains(p); w += 1 / 16) {
                        var np = p.add(a);
                        K.drawLine({
                            p1: p,
                            p2: np,
                            width: 2,
                            color: K.WHITE,
                            opacity: w,
                        });
                        p = np;
                    }
                    if (!this.paused) {
                        const b = K.dt() * x.speed
                        x.opacity -= b;
                        x.pos = x.pos.add(a.scale(b * this.windForce / 20));
                    }
                }
                while (wisps.length < maxWisps) {
                    const start = s.random();
                    const speed = K.rand(0.5, 2);
                    wisps.push({ pos: start, opacity: 1, speed });
                }
                K.popTransform();
            }
        }
    };
}
