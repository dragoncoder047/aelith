import { Key, KGamepadButton, MouseButton } from "kaplay";

type ButtonBinding = {
    keyboard?: Key[],
    mouse?: MouseButton[],
    gamepad?: KGamepadButton[]
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
    throw: {
        mouse: ["right"],
        gamepad: ["rtrigger"],
    },
    target1: {
        mouse: ["left"],
        gamepad: ["rstick"],
    },
    target2: {
        keyboard: ["t"],
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
    read_manpage: {
        keyboard: ["x"],
        gamepad: ["north"],
    },
    inspect_next: {
        keyboard: ["g"],
        gamepad: ["east"],
    },
    // inventory controls
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
        gamepad: ["south"],
    },
    nav_back: {
        keyboard: ["backspace"],
        gamepad: ["east"],
    }
};
