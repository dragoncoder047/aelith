import { Key, KGamepadButton, MouseButton, Vec2 } from "kaplay";
import { K } from "../context";
import * as PlatformGuesser from "../PlatformGuesser";
import { BUTTONS, ExtendedButtonBinding } from "../static/buttons";
import { ButtonsDpadInput, DirectionalInput, GamepadInput, MouseWheelInput } from "./DirectionalAbstraction";
import { STICK_DEADZONE } from "../static/constants";

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
                e.push(new GamepadInput(d.gamepad[0], d.gamepad[1]));
            if (d.mouseWheel)
                e.push(new MouseWheelInput(d.mouseWheel));
        }
    }
}
export function loadAssets() {
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
    K.strings.button = (s: string) => getDisplayForInput(s, false);
    K.strings.pr_btn = (s: string) => getDisplayForInput(s, true);
}

function getDisplayForInput(input: string, checkPressed: boolean) {
    const btn = K.getButton(input) as ExtendedButtonBinding;
    if (K.getLastInputDeviceType() === "gamepad") {
        if (btn.gamepad) return gamepadButtons(btn.gamepad, checkPressed).join("/");
    } else {
        if (btn.mouse) return mouseButton(btn.mouse, checkPressed);
        if (btn.keyboard) return keyboardButtons(btn.keyboard, checkPressed).join("/");
    }
    if (btn.directional) return directionalButton(btn.directional, input, checkPressed);
    return "[?a-unk?]";
}

function multiDisplayInput(input: string, checkPressed: boolean) {
    const btn = K.getButton(input) as ExtendedButtonBinding;
    if (K.getLastInputDeviceType() === "gamepad") {
        if (btn.gamepad) return gamepadButtons(btn.gamepad, checkPressed)
    } else {
        return [...(btn.keyboard ? keyboardButtons(btn.keyboard, checkPressed) : []), ...(btn.mouse ? [mouseButton(btn.mouse, checkPressed)] : [])];
    }
    return [];
}

function directionalButton(directional: NonNullable<ExtendedButtonBinding["directional"]>, input: string, checkPressed: boolean) {
    var delta: Vec2 | undefined = undefined;
    var str = "[?d-unk?]";
    if (K.getLastInputDeviceType() === "gamepad") {
        if (directional.gamepad) {
            const [s, d] = directional.gamepad;
            str = gamepadFontStr((d.eq(K.Vec2.ONE) ? "JK" : d.x > 1 ? "Xx" : "Yy")[+(s === "right")]!);
        }
    } else if (directional.mouseMove) {
        if (checkPressed) delta = K.mouseDeltaPos();
        str = " [mousefont]m[/mousefont] ";
    } else if (directional.mouseWheel) {
        str = " [mousefont]s[/mousefont] ";
    } else if (directional.buttons) {
        str = "";
        const b = directional.buttons;
        const bits = [b[1]?.[1], b[0]?.[0], b[1]?.[0], b[0]?.[1]].filter(x => x !== undefined);
        var zipOptions = bits.map(b => multiDisplayInput(b, checkPressed));
        var len = Math.max(...zipOptions.map(z => z.length));
        if (len === 1) {
            len = zipOptions.length;
            zipOptions = [zipOptions.map(z => z[0]!)];
        }
        for (var t = 0; t < len; t++) {
            if (t > 0) str += "/";
            for (var d = 0; d < zipOptions.length; d++) {
                str += zipOptions[d]?.[t] ?? "";
            }
        }
    }
    if (checkPressed) {
        if (!delta) delta = getMotionInput(input);
        if (delta.slen() > STICK_DEADZONE * STICK_DEADZONE) str = `[pressed]${str}[/pressed]`;
    }
    return str;
}

interface IFontEntry {
    w: 1 | 2 | 3,
    ch: string,
}

function gamepadFontStr(ch: string): string {
    return ` [font_${PlatformGuesser.currentGamepadType()}]${ch}[/font_${PlatformGuesser.currentGamepadType()}] `;
}

function gamepadButtons(btn: KGamepadButton | KGamepadButton[], checkPressed: boolean): string[] {
    if (!Array.isArray(btn)) btn = [btn];
    var ch: string | undefined;
    for (var [candBtn, candCh] of GAMEPAD_BUTTONS) {
        if (candBtn.sort().join() === btn.sort().join()) {
            ch = candCh;
            break;
        }
    }
    if (ch !== undefined) {
        const s = gamepadFontStr(ch);
        if (checkPressed && K.isGamepadButtonDown(btn as any as KGamepadButton))
            return [`[pressed]${s}[/pressed]`];
        return [s];
    }
    if (btn.length > 1) return btn.flatMap(b => gamepadButtons(b, checkPressed));
    return [];
}

function mouseButton(btn: MouseButton, checkPressed: boolean) {
    const ch = MOUSE_BUTTONS[btn];
    if (ch) {
        const s = ` [mousefont]${ch}[/mousefont] `;
        if (checkPressed && K.isMouseDown(btn))
            return `[pressed]${s}[/pressed]`;
        return s;
    }
    return "[?m-unk?]";
}

function keyboardButtons(btn: Key[], checkPressed: boolean) {
    return btn.flatMap(k => {
        const e = KEYS[k];
        if (!e) return [];
        const s = keyEntry(e);
        if (checkPressed && K.isKeyDown(k))
            return [`[pressed]${s}[/pressed]`];
        return [s];
    });
}

function keyEntry(e: IFontEntry): string {
    const pad = " ".repeat(Math.min(2, e.w));
    return `${pad}[keyfont_${e.w}]${e.ch}[/keyfont_${e.w}]${pad}`;
}

const GAMEPAD_BUTTONS: [KGamepadButton[], string][] = [
    [["dpad-up", "dpad-down", "dpad-left", "dpad-right"], "d"],
    [["dpad-up", "dpad-down"], "v"],
    [["dpad-left"], "1"],
    [["dpad-up"], "2"],
    [["dpad-right"], "3"],
    [["dpad-down"], "4"],
    [["north"], "N"],
    [["east"], "E"],
    [["west"], "W"],
    [["south"], "S"],
    [["lshoulder"], "l"],
    [["rshoulder"], "r"],
    [["ltrigger"], "L"],
    [["rtrigger"], "R"],
    [["select"], "e"],
    [["start"], "t"],
    [["lstick"], "j"],
    [["rstick"], "k"],
];

const MOUSE_BUTTONS: Partial<Record<MouseButton, string>> = {
    "left": "l",
    "right": "r",
};

const KEYS: Partial<Record<Key, IFontEntry>> = {
    ...Object.fromEntries([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"].map(ch => [ch.toLowerCase(), { ch, w: 1 }])),
    "left": { w: 1, ch: "a" },
    "up": { w: 1, ch: "w" },
    "right": { w: 1, ch: "d" },
    "down": { w: 1, ch: "s" },
    "tab": { w: 2, ch: "t" },
    "enter": { w: 2, ch: "n" },
    "shift": { w: 2, ch: "^" },
    "esc": { w: 2, ch: "e" },
    "backspace": { w: 2, ch: "b" },
    "space": { w: 3, ch: "s" },
};
