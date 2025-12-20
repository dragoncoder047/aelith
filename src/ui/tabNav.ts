import { AreaComp, GameObj, OpacityComp, PosComp, SpriteComp } from "kaplay";
import { ScrollerComp } from ".";
import { K } from "../context";
import * as GameManager from "../GameManager";

export function installTabNavigation(allowedToAutoFocus: boolean) {
    const objects = K.get<PosComp | SpriteComp | AreaComp>("focusable");
    const navigate = (d: number, first = false) => {
        const newFocusIndex = (d + objects.length + objects.findIndex(o => o.is("focused"))) % objects.length;
        const justFocused = objects[newFocusIndex]!;
        objects.forEach(o => o === justFocused ? o.tag("focused") : o.untag("focused"));
        if (!first) K.play(GameManager.getUIKey("sounds", "switch"));
        focusThing.time = 0;
        K.get<ScrollerComp>("scroller")[0]?.showObj(justFocused);
    }
    K.scene.onButtonPress("nav_down", () => {
        navigate(1);
    });
    K.scene.onButtonPress("nav_up", () => {
        navigate(-1);
    });
    K.scene.onButtonPress("nav_select", () => {
        K.get("focused")[0]?.action?.();
    });
    K.scene.onButtonPress("nav_left", () => {
        const obj = K.get("focused")[0];
        if (obj && obj.changeBy) {
            K.play(GameManager.getUIKey("sounds", "switch"));
            obj.changeBy((obj.lo - obj.hi) * 0.1);
        }
    });
    K.scene.onButtonPress("nav_right", () => {
        const obj = K.get("focused")[0];
        if (obj && obj.changeBy) {
            K.play(GameManager.getUIKey("sounds", "switch"));
            obj.changeBy((obj.hi - obj.lo) * 0.1);
        }
    });
    K.scene.onMouseMove(() => {
        objects.forEach(o => o.untag("focused"));
    });
    const focusThing = K.add([
        K.sprite(GameManager.getUIKey("sprites", "focus")),
        K.pos(),
        K.opacity(0),
        K.z(2),
        {
            time: 0,
            update(this: GameObj<{ time: number } | OpacityComp>) {
                const t = this.time += K.dt();
                this.opacity = 1 - (Math.cos(2 * t) ** 2) / (1 + Math.exp(23 - 10 * t));
            }
        }
    ]);
    focusThing.hidden = true;
    const FOCUS_PAD = 3;
    var ignoreCounter = 0;
    focusThing.onUpdate(() => {
        const focusedThing = K.get<AreaComp | PosComp | SpriteComp>("focused")[0];
        if (K.isMouseMoved()) {
            focusedThing?.untag("focus");
            focusThing.hidden = true;
        } else if (focusedThing) {
            // DAMN THIS ACCURSED HACK TO MAKE THE FOCUS THING NOT JUMP WHEN THE SCENE LOADS
            // it's not even 100% perfect :(
            var alpha = ignoreCounter > 0 ? 1 : (K.dt() * 20 * Math.LN2);
            if (focusThing.hidden) {
                ignoreCounter = 5;
                focusThing.pos = K.vec2(K.width(), K.height());
                alpha = 0;
            }
            focusThing.hidden = false;
            ignoreCounter--;
            const bb = focusedThing.worldBbox();
            focusThing.pos = K.lerp(focusThing.pos, bb.pos.sub(FOCUS_PAD), alpha);
            focusThing.width = K.lerp(focusThing.width, bb.width + 2 * FOCUS_PAD, alpha);
            focusThing.height = K.lerp(focusThing.height, bb.height + 2 * FOCUS_PAD, alpha);
        }
    });
    if (allowedToAutoFocus && K.getLastInputDeviceType() !== "mouse") {
        navigate(1, true);
    }
}
