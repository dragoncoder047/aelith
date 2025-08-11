import { ColorComp, Comp, FixedComp, GameObj, PosComp, RectComp, RotateComp, SpriteComp, Vec2 } from "kaplay";
import { LightComp, LitShaderComp } from "kaplay-lighting";
import { K } from "../init";

export interface LightHelperComp extends LightComp {
    turnOn(): void;
    turnOff(): void;
}


var lightingEnabled = true;
export function enableLighting(isEnabled: boolean) {
    var o = lightingEnabled;
    lightingEnabled = isEnabled;
    if (o !== isEnabled) light_enabled_changed.trigger();
}

const light_enabled_changed = new K.KEvent;

export function lightComp(pOffset: Vec2, strength = .2, radius = .3): LightHelperComp {
    var on = true;
    var mustTurnOn = false;
    return {
        id: "light",
        require: ["pos"],
        light: new K.Light(strength, radius),
        add(this: GameObj<PosComp | LightHelperComp>) {
            this.onPause(() => {
                this.turnOff();
            });
            this.onUnpause(() => {
                this.turnOn();
            });
            this.onShow(() => {
                this.turnOn();
            });
            this.onHide(() => {
                this.turnOff();
            });
            light_enabled_changed.add(() => {
                if (!lightingEnabled) this.turnOff();
                else mustTurnOn = true;
            });
        },

        turnOn() {
            if (!lightingEnabled) return this.turnOff();
            if (on) return;
            K.Light.addLight(this.light!);
            on = true;
            mustTurnOn = false;
        },
        turnOff() {
            if (!on) return;
            K.Light.removeLight(this.light!);
            on = mustTurnOn = false;
        },
        update(this: GameObj<PosComp | LightHelperComp | ColorComp | FixedComp>) {
            this.light!.pos = K.toWorld(this.toScreen(pOffset));
            if (mustTurnOn) this.turnOn();
        },
        inspect() {
            return `light is on: ${on}, color: ${this.light!.color}`;
        },
        destroy() {
            this.turnOff();
        }
    }
}

// wtf this doesn't work
export function litShaderHelper(nmName?: string): Comp {
    var ofr = -1;
    return {
        id: "litHelper",
        require: ["sprite"],
        add(this: GameObj<SpriteComp | LitShaderComp>) {
            nmName ??= this.sprite + "-nm";
            this.use(K.litShader("litSprite"));
        },
        update(this: GameObj<SpriteComp | LitShaderComp | RotateComp>) {
            if (!lightingEnabled) return;
            this.rot = K.deg2rad(this.angle ?? 0);
            if (this.frame === ofr && this.tex != null && this.nm != null) return;
            this.tex = K.getUVBounds(this.sprite, this.frame);
            this.nm = K.getUVBounds(nmName!, this.frame);
            ofr = this.frame;
        },
        inspect(this: GameObj<SpriteComp | LitShaderComp>) {
            return `litHelper: nm=${nmName} tex=${!!this.tex} nm=${!!this.nm}`
        }
    }
}

// IDK where to put this

K.add([
    K.rect(K.width(), K.height()),
    K.pos(K.center()),
    K.color(K.getBackground()!),
    K.anchor("center"),
    K.layer("behindEverything"),
    K.litShader("bg"),
    {
        update(this: GameObj<RectComp | PosComp>) {
            this.width = K.width();
            this.height = K.height();
            this.pos = K.getCamPos();
        }
    }
]);
