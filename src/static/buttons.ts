import { ButtonBinding, KGamepadStick, Vec2 } from "kaplay";
import { K } from "../context";

export interface ExtendedButtonBinding extends ButtonBinding {
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
    jump: {
        keyboard: "space",
        gamepad: "south",
    },
    sprint: {
        keyboard: "shift",
        gamepad: "lstick",
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
    throw: {
        mouse: "right",
        gamepad: "rtrigger",
    },
    target1: {
        mouse: "left",
        gamepad: "rstick",
    },
    target2: {
        keyboard: "x",
        gamepad: "ltrigger",
    },
    action1: {
        keyboard: ["e", "enter"],
        gamepad: "dpad-down",
    },
    action2: {
        keyboard: "r",
        gamepad: "dpad-right",
    },
    action3: {
        keyboard: "q",
        gamepad: "dpad-left",
    },
    action4: {
        keyboard: "v",
        gamepad: "dpad-up",
    },
    action5: {
        keyboard: "g",
        gamepad: "east",
    },
    action6: {
        keyboard: "f",
        gamepad: "west",
    },
    // inventory controls
    scroll_inventory: {
        directional: {
            buttons: [["inv_previous", "inv_next"], ,],
        }
    },
    inv_previous: {
        keyboard: "z",
        gamepad: "lshoulder"
    },
    inv_next: {
        keyboard: "c",
        gamepad: "rshoulder"
    },
    // pause menu controls
    start_game: {
        keyboard: "space",
        gamepad: "south",
    },
    main_menu_options: {
        keyboard: ",",
        gamepad: "start"
    },
    pause_unpause: {
        keyboard: "escape",
        gamepad: "start",
    },
    nav_left: {
        keyboard: ["a", "left"],
        gamepad: "dpad-left"
    },
    nav_up: {
        keyboard: ["w", "up", "shift+tab"],
        gamepad: "dpad-up"
    },
    nav_right: {
        keyboard: ["d", "right"],
        gamepad: "dpad-right"
    },
    nav_down: {
        keyboard: ["s", "down", "tab"],
        gamepad: "dpad-down"
    },
    nav_select: {
        keyboard: "enter",
        gamepad: "south",
    },
    nav_back: {
        keyboard: "escape",
        gamepad: "east",
    },
    nav_scroll: {
        directional: {
            mouseWheel: K.vec2(0, 1),
            gamepad: ["right", K.vec2(0, 1)]
        }
    }
};
