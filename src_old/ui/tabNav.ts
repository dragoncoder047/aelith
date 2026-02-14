import { AreaComp, GameObj, OpacityComp, PosComp, SpriteComp } from "kaplay";
import { ScrollerComp } from ".";
import { K } from "../../src/context";
import * as GameManager from "../GameManager";

export function installTabNavigation(allowAutoFocus: boolean) {
    const objects = K.get<PosComp | SpriteComp | AreaComp>("focusable", { liveUpdate: true });
    const getNextFocused = (d: number) => {
        const newFocusIndex = (d + objects.length + objects.findIndex(o => o.is("focused"))) % objects.length;
        return objects[newFocusIndex]!;
    }
    const navigate = (d: number, first = false) => {
        const justFocused = getNextFocused(d);
        objects.forEach(o => o === justFocused ? o.tag("focused") : o.untag("focused"));
        if (!first) GameManager.playUISound("switch");
        focusThing.time = 0;
        K.get<ScrollerComp>("scroller")[0]?.showObj(justFocused);
    }
    K.scene.onButtonPress("gui_down", () => {
        navigate(1);
    });
    K.scene.onButtonPress("gui_up", () => {
        navigate(-1);
    });
    K.scene.onButtonPress("gui_select", () => {
        K.get("focused")[0]?.action?.();
    });
    K.scene.onButtonPress("gui_left", () => {
        const obj = K.get("focused")[0];
        if (obj && obj.changeBy) {
            GameManager.playUISound("switch");
            obj.changeBy((obj.lo - obj.hi) * 0.05);
        }
    });
    K.scene.onButtonPress("gui_right", () => {
        const obj = K.get("focused")[0];
        if (obj && obj.changeBy) {
            GameManager.playUISound("switch");
            obj.changeBy((obj.hi - obj.lo) * 0.05);
        }
    });
    K.scene.onMouseMove(() => {
        objects.forEach(o => o.untag("focused"));
    });
    const focusThing = K.add([
        K.sprite(GameManager.getUIKey("sprites", "focus")),
        K.pos(K.width(), K.height()),
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
    var prevPos = K.Vec2.ONE, prevObj: GameObj | undefined;
    focusThing.onUpdate(() => {
        const focusedThing = K.get<AreaComp | PosComp | SpriteComp>("focused")[0];
        if (K.isMouseMoved()) {
            focusedThing?.untag("focus");
            focusThing.hidden = true;
        } else if (focusedThing) {
            const bb = focusedThing.worldBbox();

            var alpha = (focusThing.hidden || (prevObj === focusedThing && !prevPos.eq(bb.pos))) ? 1 : (K.dt() * 20 * Math.LN2);
            focusThing.hidden = false;
            focusThing.pos = K.lerp(focusThing.pos, bb.pos.sub(FOCUS_PAD), alpha);
            focusThing.width = K.lerp(focusThing.width, bb.width + 2 * FOCUS_PAD, alpha);
            focusThing.height = K.lerp(focusThing.height, bb.height + 2 * FOCUS_PAD, alpha);
            prevPos = bb.pos.clone();
        }
        prevObj = focusedThing;
    });

    if (allowAutoFocus) {
        if (K.getLastInputDeviceType() === "mouse") return;
        if (getNextFocused(1)?.is("back")) return;
        navigate(1, true);
    }
}
