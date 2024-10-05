// @ts-expect-error
// why is this not exported??
import { ButtonsDef } from "kaplay";

export const CONTROLS: ButtonsDef = {
    // action controls
    jump: {
        keyboard: ["space"],
        gamepad: ["south"],
    },
    click: {
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
