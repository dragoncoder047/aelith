import { ButtonBinding, Key, KGamepadButton, KGamepadStick, MouseButton, Vec2 } from "kaplay";
import { K } from "../context";

export interface ExtendedButtonBinding extends ButtonBinding {
    mouse?: MouseButton,
    keyboard?: Key[],
    directional?: {
        gamepad?: [KGamepadStick, Vec2];
        buttons?: [[string, string] | undefined, [string, string] | undefined];
        mouseWheel?: Vec2;
        mouseMove?: boolean;
    }
}

type Controls = {
    [button: string]: ExtendedButtonBinding;
}

export const BUTTONS: Controls = {
    // action controls
    move: {
        directional: {
            gamepad: ["left", K.Vec2.ONE],
            buttons: [["move_left", "move_right"], ["move_down", "move_up"]],
        }
    },
    look: {
        directional: {
            gamepad: ["right", K.Vec2.ONE],
            mouseMove: true,
        }
    },
    move_left: {
        keyboard: ["a", "left"],
    },
    move_right: {
        keyboard: ["d", "right"],
    },
    move_up: {
        keyboard: ["w", "up"],
    },
    move_down: {
        keyboard: ["s", "down"],
    },
    jump: {
        keyboard: ["space"],
        gamepad: ["south"],
    },
    throw: {
        mouse: "right",
        gamepad: ["rtrigger"],
    },
    target1: {
        mouse: "left",
        gamepad: ["rstick"],
    },
    target2: {
        keyboard: ["x"],
        gamepad: ["ltrigger"],
    },
    inspect: {
        keyboard: ["f"],
        gamepad: ["west"],
    },
    action1: {
        keyboard: ["e", "enter"],
        gamepad: ["dpad-down"],
    },
    action2: {
        keyboard: ["r"],
        gamepad: ["dpad-right"],
    },
    action3: {
        keyboard: ["q"],
        gamepad: ["dpad-left"],
    },
    action4: {
        keyboard: ["v"],
        gamepad: ["dpad-up"],
    },
    inspect_next: {
        keyboard: ["g"],
        gamepad: ["east"],
    },
    // inventory controls
    scroll_inventory: {
        directional: {
            buttons: [["inv_previous", "inv_next"], ,],
        }
    },
    inv_previous: {
        keyboard: ["z"],
        gamepad: ["lshoulder"]
    },
    inv_next: {
        keyboard: ["c"],
        gamepad: ["rshoulder"]
    },
    // motion controls
    sprint: {
        keyboard: ["shift"],
        gamepad: ["lstick"],
    },
    // pause menu controls
    pause_unpause: {
        keyboard: ["tab"],
        gamepad: ["start"],
    },
    nav_left: {
        keyboard: ["a", "left"],
        gamepad: ["dpad-left"]
    },
    nav_up: {
        keyboard: ["w", "up"],
        gamepad: ["dpad-up"]
    },
    nav_right: {
        keyboard: ["d", "right"],
        gamepad: ["dpad-right"]
    },
    nav_down: {
        keyboard: ["s", "down"],
        gamepad: ["dpad-down"]
    },
    nav_select: {
        keyboard: ["enter"],
        gamepad: ["south"],
    },
    nav_back: {
        keyboard: ["backspace"],
        gamepad: ["east"],
    }
};
