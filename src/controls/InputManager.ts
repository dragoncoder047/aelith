import { K } from "../context";
import { BUTTONS } from "../static/buttons";
import { ButtonsDpadInput, DirectionalInput, GamepadInput } from "./DirectionalAbstraction";

const motionControls: Record<string, DirectionalInput[]> = {};
export function getMotionInput(name: string) {
    if (!(name in motionControls)) return K.Vec2.ZERO;
    const v = motionControls[name]!.reduce((a, inp) => a.add(inp.poll()), K.Vec2.ZERO);
    return v.slen() > 1 ? v.unit() : v;
}
export function setupControls() {
    for (var button of Object.keys(BUTTONS)) {
        const entry = BUTTONS[button]!;
        K.setButton(button, entry);
        if (entry.directional) {
            const d = entry.directional;
            const e = (motionControls[button] ??= []);
            if (d.buttons)
                e.push(new ButtonsDpadInput(
                    d.buttons[0]?.[0],
                    d.buttons[0]?.[1],
                    d.buttons[1]?.[0],
                    d.buttons[1]?.[1]));
            if (d.gamepad)
                e.push(new GamepadInput(d.gamepad[0], d.gamepad[1]))
        }
    }
    // TODO: setup the strings
}
export function loadFonts() {
    const m = "loadBitmapFontFromSprite" as const;
    const GP_FONT_CHARS = "d1234vNEWSlrLRetJKXxYyjk"; // cSpell: ignore yyjk
    K[m]("font_xbox", GP_FONT_CHARS);
    K[m]("font_switch", GP_FONT_CHARS);
    K[m]("font_ps4", GP_FONT_CHARS);
    K[m]("font_ps5", GP_FONT_CHARS);
    K[m]("keyfont_1", "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789wasd");
    K[m]("keyfont_2", "tn^eb");
    K[m]("keyfont_3", "s");
    K[m]("mousefont", "mlrs"); // cSpell: ignore mlrs
}
