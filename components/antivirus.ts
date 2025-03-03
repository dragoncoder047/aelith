import { AreaComp, BodyComp, Color, Comp, GameObj, OffScreenComp, PosComp, RaycastResult, RotateComp, SpriteComp, StateComp, TimerComp, TweenController } from "kaplay";
import { SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { WorldManager } from "../levels";
import { actuallyRaycast } from "../misc/utils";
import { player } from "../player";
import { DynamicTextComp } from "../plugins/kaplay-dynamic-text";
import { LinkComp } from "./linked";
import { TogglerComp } from "./toggler";

export interface AntivirusComp extends Comp {
    alertTextObj: GameObj<DynamicTextComp> | undefined
    disallowedContinuations: string[]
    alertMessage: string
    allClearMessage: string
    additionalStyles: string[]
    allClearStyles: string[]
    sweepAngleRange: [number, number]
    maxDistance: number
    sweepSpeed: number
    laserColor: Color | string
    rayHit: RaycastResult
    sweepy(): void
    isOffensive(obj: GameObj | undefined): boolean
}

export function antivirus(): AntivirusComp {
    var tweener: TweenController | undefined = undefined;
    return {
        id: "antivirus",
        require: ["rotate", "linked", "state", "toggler", "timer", "offscreen"],
        disallowedContinuations: [],
        alertMessage: "&msg.antivirus.detected",
        allClearMessage: "&msg.antivirus.allClear",
        additionalStyles: ["blink"],
        allClearStyles: ["assert"],
        alertTextObj: undefined,
        sweepAngleRange: [-10, -30],
        maxDistance: TILE_SIZE * 100,
        sweepSpeed: 20,
        laserColor: K.BLUE,
        rayHit: null,
        add(this: GameObj<TogglerComp | TimerComp | StateComp | AntivirusComp | RotateComp>) {
            this.onStateEnter(this.falseState, () => this.sweepy());
        },
        sweepy(this: GameObj<TimerComp | AntivirusComp | RotateComp>) {
            var [from, to] = this.sweepAngleRange;
            if (Math.abs(this.angle - from) > Math.abs(this.angle - to))
                [from, to] = [to, from];
            this.angle = K.clamp(this.angle, from, to);
            if (to == from) return;
            tweener = this.tween(
                this.angle, to,
                Math.abs(this.angle - to) / this.sweepSpeed,
                val => this.angle = val,
                K.easings.easeInOutSine);
            tweener.onEnd(() => this.sweepy());
        },
        update(this: GameObj<TimerComp | TogglerComp | AntivirusComp | RotateComp | PosComp>) {
            if (this.sweepAngleRange[1] < this.sweepAngleRange[0]) this.sweepAngleRange = [this.sweepAngleRange[1], this.sweepAngleRange[0]];
            if (this.togglerState) {
                if (tweener) tweener.cancel();
                tweener = undefined;
                // point at player
                this.angle = this.worldPos()!.sub((this.rayHit?.object ?? player).worldPos()!).angle();
                // show alert text
                if (this.alertTextObj) {
                    this.alertTextObj.t = style(this.alertMessage,
                        [((player.inventory.find(x => this.isOffensive(x)) ?? this.rayHit?.object) as any)?.name]
                            .filter(x => x !== undefined)
                            .concat(this.additionalStyles)
                            .map(t => t.replace(/[^\w]/g, "")));
                }
            } else if (this.alertTextObj) {
                this.alertTextObj.t = style(this.allClearMessage, this.allClearStyles);
            }
        },
        draw(this: GameObj<AntivirusComp | SpriteComp | PosComp | LinkComp | OffScreenComp | TogglerComp | RotateComp>) {
            if (typeof this.laserColor === "string") this.laserColor = K.Color.fromHex(this.laserColor);
            // do raycast to things
            const objects = WorldManager.getLevelOf(this)!.get<AreaComp | PosComp | BodyComp>(["area", "body"])
                .concat([player])
                .filter((x: any) => x !== this && !x.paused)
                .filter(x => x.collisionIgnore.isDisjointFrom(this.tagsAsSet));
            const dontCareDistSquared = Math.pow(this.maxDistance * 1.5, 2);
            const offensiveObjects = objects
                .filter(o => this.isOffensive(o));
            const obstacles = objects
                .filter(x => x.isStatic)
            const r = (o: GameObj<AreaComp>[], a: number) =>
                actuallyRaycast(o, this.worldPos()!,
                    K.LEFT.rotate(a), this.maxDistance);
            var offended = false;
            for (var o of offensiveObjects) {
                if (player.inventory.includes(o as any)) o = player;
                if (o.worldPos()!.sdist(this.worldPos()!) > dontCareDistSquared) continue;
                this.rayHit = r(obstacles.concat([o]), this.worldPos()!.sub(o.worldPos()!).angle());
                if (this.rayHit !== null && this.isOffensive(this.rayHit.object)) {
                    if (!this.togglerState) this.broadcast(this.toggleMsg);
                    offended = true;
                }
            }
            if (!offended) {
                this.rayHit = r(objects, this.angle);
                if (this.togglerState) this.broadcast(this.toggleMsg)
            };
            if (this.rayHit) {
                K.drawLine({
                    p1: K.LEFT.scale(this.width / 2),
                    p2: K.LEFT.scale(this.rayHit.point.sub(this.worldPos()!).len()),
                    width: 2 / SCALE,
                    color: this.laserColor
                });
            }
        },
        isOffensive(obj) {
            if (!obj) return false;
            if (obj === player) return player.inventory.some(item => this.isOffensive(item));
            return this.disallowedContinuations.some(c => obj.name === c)
        },
    }
}

function style(t: string, ss: string[]): string {
    return `${ss.map(s => `[${s}]`).join("")}${t}${ss.toReversed().map(s => `[/${s}]`).join("")}`;
}
