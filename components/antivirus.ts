import { AreaComp, Color, Comp, GameObj, PosComp, RaycastResult, RotateComp, SpriteComp, StateComp, TimerComp, TweenController } from "kaplay";
import { SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { DynamicTextComp } from "../plugins/kaplay-dynamic-text";
import { actuallyRaycast } from "../utils";
import { LinkComp } from "./linked";
import { TogglerComp } from "./toggler";
import { MParser } from "../assets/mparser";

export interface AntivirusComp extends Comp {
    alertTextObj: GameObj<DynamicTextComp> | undefined
    disallowedContinuations: string[]
    alertMessage: string
    allClearMessage: string
    additionalStyles: string[]
    allClearStyles: string[]
    sweepAngleRange: [number, number],
    maxDistance: number,
    sweepSpeed: number
    laserColor: Color | string,
    rayHit: RaycastResult
    sweepy(): void
}

export function antivirus(offState = "off", onState = "on"): AntivirusComp {
    var tweener: TweenController | undefined = undefined;
    return {
        id: "antivirus",
        require: ["rotate", "linked", "state", "toggler", "timer"],
        disallowedContinuations: [],
        alertMessage: "&msg.antivirus.detected",
        allClearMessage: "&msg.antivirus.allClear",
        additionalStyles: ["blink"],
        allClearStyles: ["assert"],
        alertTextObj: undefined,
        sweepAngleRange: [-10, -30],
        maxDistance: TILE_SIZE * 100,
        sweepSpeed: 6,
        laserColor: K.BLUE,
        rayHit: null,
        add(this: GameObj<TogglerComp | TimerComp | StateComp | AntivirusComp | RotateComp>) {
            this.onStateEnter(offState, () => this.sweepy());
        },
        sweepy(this: GameObj<TimerComp | AntivirusComp | RotateComp>) {
            var [from, to] = this.sweepAngleRange;
            if (Math.abs(this.angle - from) > Math.abs(this.angle - to))
                [from, to] = [to, from];
            tweener = this.tween(
                from, to,
                Math.abs(from - to) / this.sweepSpeed,
                val => this.angle = val,
                K.easings.easeInOutSine);
            tweener.onEnd(() => this.sweepy());
        },
        update(this: GameObj<TimerComp | TogglerComp | AntivirusComp | RotateComp | PosComp | LinkComp>) {
            if (this.togglerState) {
                if (tweener) tweener.cancel();
                tweener = undefined;
                // point at player
                this.angle = this.worldPos()!.sub(player.worldPos()!).angle();
                // show alert text
                if (this.alertTextObj) {
                    this.alertTextObj.t = style(this.alertMessage,
                        [player.inventory.find(x => this.disallowedContinuations.some(c => x.name === c))?.name]
                            .filter(x => x !== undefined)
                            .concat(this.additionalStyles)
                            .map(t => t.replace(/[^\w]/g, "")));
                }
            } else {
                if (this.alertTextObj) {
                    this.alertTextObj.t = style(this.allClearMessage, this.allClearStyles);
                }
            }
            // do raycast only to player
            this.rayHit = actuallyRaycast(
                MParser.world!.get<AreaComp>(["area"])
                    .concat([player])
                    .filter((x: any) => !player.inventory.includes(x))
                    .filter((x: any) => x !== this),
                this.worldPos()!, K.LEFT.rotate(this.angle), this.maxDistance);
            if (this.rayHit !== null
                && this.rayHit.object === player
                && player.inventory.some(x => this.disallowedContinuations.some(c => x.name === c))) {
                if (!this.togglerState) this.broadcast(this.toggleMsg);
            } else if (this.togglerState) this.broadcast(this.toggleMsg);
        },
        draw(this: GameObj<AntivirusComp | SpriteComp | PosComp>) {
            if (typeof this.laserColor === "string") this.laserColor = K.Color.fromHex(this.laserColor);
            if (this.rayHit) {
                K.drawLine({
                    p1: K.LEFT.scale(this.width / 2),
                    p2: K.LEFT.scale(this.rayHit.point.sub(this.worldPos()!).len()),
                    width: 2 / SCALE,
                    color: this.laserColor
                });
            }
        }
    }
}

function style(t: string, ss: string[]): string {
    const out = `${ss.map(s => `[${s}]`).join("")}${t}${ss.toReversed().map(s => `[/${s}]`).join("")}`;
    console.log(out);
    return out;
}
