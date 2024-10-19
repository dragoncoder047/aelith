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
        gamepad: ["rtrigger"],
    },
    throw: {
        mouse: ["right"],
        gamepad: ["rstick"],
    },
    invoke: {
        keyboard: ["e", "enter"],
        gamepad: ["rshoulder"],
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
    climb: {
        keyboard: ["q", "shift"],
        gamepad: ["lshoulder"],
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
};
