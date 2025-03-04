import { showManpage } from ".";
import { musicPlay } from "../assets";
import { K } from "../init";
import { WorldManager } from "../levels";
import { guessOS, isFirefox, isTouchscreen } from "../misc/utils";
import { player } from "../player";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";
import { PtyMenu } from "../plugins/kaplay-pty";
import { modalmenu } from "../ui/menuFactory";
import { timer } from "../ui/timer";
import { detectGamepadType, isSingleJoyCon } from "./autodetectGamepad";

// save for autodetect
const availableLangs = K.langs.slice();

const gcTypeMenu: PtyMenu = {
    id: "set controllerType",
    name: "&msg.pause.controllerType",
    type: "select",
    opts: [
        { text: "Xbox   (&xbox.west &xbox.north &xbox.east &xbox.south, &xbox.select/&xbox.start)", value: "xbox" },
        { text: "Switch (&switch.west &switch.north &switch.east &switch.south, &switch.select/&switch.start)", value: "switch" },
        { text: "PS5    (&ps5.west &ps5.north &ps5.east &ps5.south, &ps5.select/&ps5.start)", value: "ps5" },
        { text: "PS4    (&ps4.west &ps4.north &ps4.east &ps4.south, &ps4.select/&ps4.start)", value: "ps4" },
    ],
    selected: 0,
    hidden: true
};

const rumbleOption = { text: "&msg.pause.controllerRumble", value: "rumble", hidden: true };

export const PAUSE_MENU: PtyMenu = {
    id: "sysctl",
    type: "submenu",
    name: "&msg.pause.paused",
    opts: [
        {
            id: "settings -i",
            name: "&msg.pause.preferences",
            type: "select",
            opts: [
                rumbleOption,
                { text: "&msg.pause.showSpeedrunTimer", value: "timer" },
                { text: "&msg.pause.showControlHints", value: "controlHints" },
                { text: "&msg.pause.playBgMusic", value: "music" },
                { text: "&msg.pause.playSfx", value: "sfx" },
            ],
            selected: [0, 1, 2, 3, 4],
            multiple: true
        },
        gcTypeMenu,
        {
            id: "set language",
            name: "&msg.pause.setLanguage",
            type: "select",
            opts: [
                { text: "&msg.pause.automaticLang", value: availableLangs },
                { text: "English", value: ["en"] },
                { text: "Español", value: ["es"] },
                { text: "Deutsch", value: ["de"] },
                { text: "日本語", value: ["ja"] }
            ],
            selected: 0
        },
        {
            id: "ng-connect",
            name: "&msg.pause.ngConnect",
            type: "action",
            async action() {
                await PAUSE_MENU_OBJ.term.type({ text: "&msg.notImplemented\n", styles: ["stderr"] });
            },
            hidden: true
        },
        {
            id: "restart",
            name: "&msg.pause.restart",
            type: "submenu",
            opts: [
                {
                    id: "--yes",
                    name: "&msg.pause.reallyRestart",
                    type: "action",
                    async action() {
                        await PAUSE_MENU_OBJ.term.quitMenu();
                        window.location.reload();
                    }
                }
            ]
        },
        {
            id: "teststring",
            name: "testing string",
            prompt: "Enter an IP address:",
            type: "string",
            value: "0.0.0.0",
            validator: /^(\d{1,3}\.){3}\d{1,3}$/,
            invalidMsg: "Invalid IP address",
            hidden: true
        },
        {
            id: "testrange",
            name: "testing range",
            type: "range",
            range: [0, 100],
            displayRange: [0, 100],
            value: 50,
            barWidth: 25,
            hidden: true
        }
    ]
}

export var PAUSE_MENU_OBJ = modalmenu(PAUSE_MENU, ["!dialog", "menuActive", "pauseMenu"], "&pauseMenuCtlHint",
    player.onButtonPress("pause_unpause", () => PAUSE_MENU_OBJ.open()) as KEventControllerPatch);
PAUSE_MENU_OBJ.modal.bg = K.BLACK;

export function initPauseMenu() {
    // sync testing mode for music
    if (musicPlay.paused)
        // @ts-ignore
        PAUSE_MENU.opts[0].selected.splice(3, 1);

    PAUSE_MENU_OBJ.onStart(doPause);
    PAUSE_MENU_OBJ.onQuit(doUnpause);
    PAUSE_MENU_OBJ.onUpdate(copyPreferences);
    copyPreferences();
}

function doPause() {
    WorldManager.pause(true);
}

async function doUnpause() {
    if (PAUSE_MENU_OBJ.term.menu !== PAUSE_MENU) return;
    player.hidden = player.paused = false;
    copyPreferences();
    await showManpage(false);
    WorldManager.pause(false);
}

export function copyPreferences() {
    if (!PAUSE_MENU_OBJ || PAUSE_MENU_OBJ.term.topMenu !== PAUSE_MENU) return;
    K.strings.controllerType = K.getValueFromMenu(PAUSE_MENU, "set controllerType");
    const switches = K.getValueFromMenu(PAUSE_MENU, "settings -i");
    timer.opacity = +switches?.includes("timer");
    musicPlay.paused = !switches?.includes("music");
    player.sfxEnabled = switches?.includes("sfx");
    K.rumble.enabled = switches?.includes("rumble");
    player.controlText.hidden = !switches?.includes("controlHints");
    K.langs = K.getValueFromMenu(PAUSE_MENU, "set language");
}

K.onGamepadConnect(g => {
    gcTypeMenu.hidden = false;
    rumbleOption.hidden = false;
    const id = navigator.getGamepads()[g.index]!.id;
    const which = detectGamepadType(id);
    if (which !== undefined) {
        // @ts-ignore
        PAUSE_MENU.opts[1].selected = PAUSE_MENU.opts[1].opts.findIndex(x => x.value === which);
        copyPreferences();
    }
    PAUSE_MENU_OBJ.term.__redraw(false);
    // handle special gamepad types
    if (isFirefox()) {
        player.manpage!.data = { os: guessOS() };
        showManpage(true, "&msg.dialog.firefoxDontWorkWithGamepads", true);
    } else if (isSingleJoyCon(id)) {
        showManpage(true, "&msg.dialog.singleJoyConDontHaveEnoughButtons", true);
    }
});

K.onLoad(() => {
    K.wait(0.1, () => {
        if (isTouchscreen()) {
            showManpage(true, "&msg.dialog.touchNotSupportedYet", false)
        }
    });
});
