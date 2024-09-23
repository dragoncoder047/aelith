import { type ButtonsDef } from 'kaplay';

export const CONTROLS: ButtonsDef = {
    jump: {
        keyboard: ["space"],
        gamepad: ["south"],
    },
    climb: {
        keyboard: ["q", "enter"],
        gamepad: ["lshoulder"], // cSpell: ignore lshoulder
    },
    click: {
        mouse: ["left"],
        gamepad: ["rshoulder"], // cSpell: ignore rshoulder
    },
    throw: {
        mouse: ["right"],
        gamepad: ["rtrigger"], // cSpell: ignore rtrigger
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
