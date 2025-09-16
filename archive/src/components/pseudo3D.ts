import { Comp, DrawSpriteOpt, GameObj, LayerComp, PosComp, SpriteComp, Vec2 } from "kaplay";
import { TILE_SIZE } from "../constants";
import { K } from "../init";
import { PAreaComp } from "../plugins/kaplay-aabb";

interface Pseudo3DComp extends Comp {
    p3DDrawTiled: boolean;
    p3DDepthSteps: number;
    p3DDarkenFactor: number;
    p3DOpacityFactor: number;
    drawLayer(t: number, cam: Vec2): void;
    resetT(): void;
    nextT: number;
    readonly step: number;
}

const DEPTH = 0.1;
const COLOR_FACTOR = 5;
const OPACITY_FACTOR = 5;
const IDENTITY_MATRIX = new K.Mat23();

export function pseudo3D(tiled = true, steps = TILE_SIZE): Pseudo3DComp {
    const tVec = K.vec2();
    const sVec = K.vec2();
    const drawopt: DrawSpriteOpt = {} as any;
    const c = new K.Color(0, 0, 0);
    const pw = K.vec2();
    return {
        id: "pseudo3D",
        require: ["sprite", "pos", "area"],
        p3DDrawTiled: tiled,
        p3DDepthSteps: steps,
        p3DDarkenFactor: COLOR_FACTOR,
        p3DOpacityFactor: OPACITY_FACTOR,
        nextT: 0,
        get step() {
            return DEPTH / this.p3DDepthSteps
        },
        resetT() {
            while (this.nextT < DEPTH) this.nextT += this.step;
        },
        draw() { this.resetT(); },
        add() { this.resetT(); },
        drawLayer(this: GameObj<Pseudo3DComp | SpriteComp | PosComp>, now, cam) {
            if (now <= this.nextT) {
                // According to profiling, this absolutely *SPAMS* the drawSprite calls, which
                // aren't optimized for memory usage whatsoever.
                this.nextT -= this.step;
                const t = this.nextT;
                // non-allocating version of worldPos()
                this.parent!.transform.transformPointV(this.pos, pw);
                const x = K.lerp(pw.x, cam.x, t);
                const y = K.lerp(pw.y, cam.y, t);
                const scale = 1 - t;
                tVec.set(x, y);
                sVec.set(scale, scale);
                K.pushTranslate(tVec);
                K.pushScale(sVec);
                Object.assign(drawopt, this);
                c.r = c.g = c.b = 255 * (1 - t * this.p3DDarkenFactor);
                drawopt.pos = K.Vec2.ZERO;
                drawopt.color = c;
                drawopt.opacity = 1 - (t * this.p3DOpacityFactor);
                drawopt.tiled = this.p3DDrawTiled;
                K.drawSprite(drawopt);
                sVec.set(1 / scale, 1 / scale);
                K.pushScale(sVec);
                tVec.set(-x, -y);
                K.pushTranslate(tVec);
            }
        },
    }
}

export interface P3DHelperComp extends Comp {
    p3DObjectList: GameObj<SpriteComp | PosComp | Pseudo3DComp | PAreaComp>[];
}

var pseudo3DEnabled = true;
export function enablePseudo3D(isEnabled: boolean) {
    pseudo3DEnabled = isEnabled;
}

export function p3DHelper(layer?: string): P3DHelperComp {
    layer ??= K._k.game.layers![0];
    return {
        id: "p3dHelper",
        require: ["pos"],
        p3DObjectList: [],
        add(this: GameObj<P3DHelperComp | LayerComp>) {
            if (!this.has("layer")) this.use(K.layer(layer!));
            else this.layer = layer!;
            this.p3DObjectList = this.get("pseudo3D", { liveUpdate: true, only: "comps" });
        },
        draw(this: GameObj<P3DHelperComp | PosComp>) {
            if (!pseudo3DEnabled) return;
            // step two: draw all
            K.pushTransform();
            K.pushMatrix(IDENTITY_MATRIX);
            var t = DEPTH;
            const c = K.getCamPos();
            while (t > 0) {
                var minStep = Number.MAX_VALUE;
                for (var i = 0; i < this.p3DObjectList.length; i++) {
                    const obj = this.p3DObjectList[i]!;
                    obj.drawLayer(t, c);
                    if (minStep > obj.step) minStep = obj.step;
                }
                t -= minStep;
            }
            K.popTransform();
        }
    }
}
