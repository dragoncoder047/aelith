import { Key, KGamepadButton, MouseButton } from "kaplay";

type ButtonBinding = {
    keyboard?: Key | Key[],
    mouse?: MouseButton | MouseButton[],
    gamepad?: KGamepadButton | KGamepadButton[]
}

type Controls = {
    [button: string]: ButtonBinding
}

export const CONTROLS: Controls = {
    // action controls
    jump: {
        keyboard: ["space"],
        gamepad: ["south"],
    },
    interact: {
        mouse: ["left"],
        gamepad: ["rstick"],
    },
    throw: {
        mouse: ["right"],
        gamepad: ["rtrigger"],
    },
    invoke: {
        keyboard: ["e", "enter"],
        gamepad: ["east"],
    },
    view_info: {
        gamepad: ["north"],
        keyboard: ["x"],
    },
    // inventory controls
    inv_previous: {
        keyboard: ["z"],
        gamepad: ["dpad-left"]
    },
    inv_next: {
        keyboard: ["c"],
        gamepad: ["dpad-right"]
    },
    // inventory mod controls
    invoke_increment: {
        // mouse: scroll wheel
        gamepad: ["dpad-up"],
    },
    invoke_decrement: {
        gamepad: ["dpad-down"],
    },
    // motion controls
    sprint: {
        keyboard: ["shift"],
        gamepad: ["lstick"],
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
        gamepad: ["east", "select"],
    },
    nav_back: {
        keyboard: ["backspace"],
        gamepad: ["west"],
    }
};
