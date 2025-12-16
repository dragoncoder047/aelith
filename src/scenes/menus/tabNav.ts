import { AreaComp, GameObj, OpacityComp } from "kaplay";
import { K } from "../../context";
import * as GameManager from "../../GameManager";

export function installTabNavigation() {
    const objects = K.get("focusable");
    const navigate = (d: number) => {
        const newFocusIndex = (d + objects.length + objects.findIndex(o => o.is("focused"))) % objects.length;
        objects.forEach((o, i) => i === newFocusIndex ? o.tag("focused") : o.untag("focused"));
        K.play(GameManager.getUIKey("sounds", "switch"));
        focusThing.time = 0;
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
    K.scene.onUpdate(() => {
        const firstFocus = K.get<AreaComp>("focused")[0];
        if (K.isMouseMoved()) {
            firstFocus?.untag("focus");
            focusThing.hidden = true;
        } else if (firstFocus) {
            const alpha = focusThing.hidden ? 1 : K.dt() * 20 * Math.LN2;
            focusThing.hidden = false;
            const bb = firstFocus.worldArea().bbox();
            focusThing.pos = K.lerp(focusThing.pos, bb.pos.sub(FOCUS_PAD), alpha);
            focusThing.width = K.lerp(focusThing.width, bb.width + 2 * FOCUS_PAD, alpha)
            focusThing.height = K.lerp(focusThing.height, bb.height + 2 * FOCUS_PAD, alpha)
        }
    })
}
