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
        gamepad: ["west"],
    },
    throw: {
        mouse: ["right"],
        gamepad: ["north"],
    },
    invoke: {
        keyboard: ["e", "enter"],
        gamepad: ["east"],
    },
    // motion controls
    climb: {
        keyboard: ["q", "shift"],
        gamepad: ["lshoulder"], // cSpell: ignore lshoulder
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
