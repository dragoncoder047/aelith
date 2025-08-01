import { showManpage } from ".";
import { musicPlay } from "../assets";
import { LinkComp } from "../components/linked";
import { enablePseudo3D } from "../components/pseudo3D";
import { K } from "../init";
import { WorldManager } from "../levels";
import { guessOS, isFirefox } from "../misc/utils";
import { player } from "../player";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";
import { PtyMenu } from "../plugins/kaplay-pty";
import { StatTracker } from "../stats_tracker";
import { modalmenu } from "../ui/menuFactory";
import { timer } from "../ui/timer";
import { detectGamepadType, isSingleJoyCon } from "./autodetectGamepad";

// save for autodetect
const availableLangs = K.langs;

const gcTypeMenu: PtyMenu = {
    id: "set controllerType",
    name: "&msg.pause.main.submenu.controller",
    type: "select",
    opts: ["Xbox", "Switch", "PS4", "PS5"].map(name => {
        const value = name.toLowerCase();
        return { text: { text: `${name.padEnd(7, " ")}(${[..."WNES, e/t"].map(c => /[a-z]/i.test(c) ? ` [sm][font_${value}]${c}[/font_${value}][/sm] ` : c).join("")})`, raw: true }, value }
    }),
    selected: 0,
    hidden: true
};

const rumbleOption = { text: "&msg.pause.options.rumble", value: "rumble", hidden: true };

const debugSubmenu: PtyMenu = {
    id: "debug",
    name: "Debug",
    hidden: true,
    type: "submenu",
    opts: [],
};

export const PAUSE_MENU: PtyMenu = {
    id: "sysctl",
    type: "submenu",
    name: "&msg.pause.main.title",
    opts: [
        {
            id: "settings -i",
            name: "&msg.pause.options.title",
            type: "select",
            opts: [
                rumbleOption,
                { text: "&msg.pause.options.speedrunTimer", value: "timer" },
                { text: "&msg.pause.options.controlHints", value: "controlHints" },
                { text: "&msg.pause.options.music", value: "music" },
                { text: "&msg.pause.options.soundEffects", value: "sfx" },
            ],
            selected: [0, 1, 2, 3, 4],
            multiple: true
        },
        {
            id: "settings -xg",
            name: "&msg.pause.graphics.title",
            type: "select",
            header: "&msg.pause.graphics.header",
            opts: [
                { text: "&msg.pause.graphics.pseudo3D", value: "pseudo3D" },
                // { text: "&msg.pause.graphics.lighting", value: "lighting" },
            ],
            selected: [0/*, 1 */],
            multiple: true
        },
        gcTypeMenu,
        StatTracker.menuViewer,
        {
            id: "set language",
            name: "&msg.pause.main.submenu.language",
            type: "select",
            opts: [
                { text: "&msg.pause.language.auto", value: availableLangs },
                { text: "Use English", value: ["en"] },
                { text: "Usa Español", value: ["es"] },
                // { text: "Verwenden sie Deutsch", value: ["de"] },
                // { text: "日本語を使う", value: ["ja"] }
            ],
            selected: 0
        },
        {
            id: "ng-connect",
            name: "&msg.pause.main.submenu.newgrounds",
            type: "action",
            async action() {
                await PAUSE_MENU_OBJ.term.type({ text: "&msg.notImplemented\n", styles: ["stderr"] });
            },
            hidden: true
        },
        {
            id: "restart",
            name: "&msg.pause.restart.title",
            type: "submenu",
            opts: [
                {
                    id: "--yes",
                    name: "&msg.pause.restart.confirm",
                    type: "action",
                    quit: true,
                    action() {
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
        },
        debugSubmenu
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

    (debugSubmenu as any).opts.push(
        {
            id: "yoink",
            name: "Yoink continuation trap",
            type: "submenu",
            opts: K.get("continuationTrap", { recursive: true }).map(t => {
                return {
                    type: "action",
                    id: t.name,
                    name: t.name,
                    quit: true,
                    action() {
                        player.grab(t as any);
                    }
                }
            }),
        } satisfies PtyMenu,
        {
            id: "tp",
            name: "Teleport to level",
            type: "submenu",
            opts: Object.keys(WorldManager.allLevels).map(name => {
                return {
                    id: name,
                    name: name,
                    type: "action",
                    quit: true,
                    action() {
                        WorldManager.goLevel(name);
                    }
                }
            }),
        } satisfies PtyMenu,
        {
            id: "sesame",
            name: "Open Sesame",
            type: "string",
            value: "",
            validator: {
                test(str) {
                    return K.get<LinkComp>("linked", { recursive: true }).some(o => o.linkGroup === str);
                }
            },
            invalidMsg: "no such group.",
            onSubmit(str, menu) {
                K.get<LinkComp>("linked", { recursive: true }).find(x => x.linkGroup === str)!.broadcast("toggle");
                menu.value = "";
            },
            quit: true,
        } satisfies PtyMenu,
        {
            id: "eval",
            name: "Javascript",
            type: "string",
            value: "",
            validator: {
                test(str) {
                    try {
                        new Function("return " + str);
                        return true;
                    } catch (e: any) {
                        return { reject: e.message ?? String(e) };
                    }
                }
            },
            invalidMsg: "syntax error.",
            async onSubmit(str, menu) {
                try {
                    await new Function("return " + str)();
                } catch (e: any) {
                    console.error(e);
                    return e.message ?? String(e);
                }
                menu.value = "";
            },
            quit: true,
        } satisfies PtyMenu);

    copyPreferences();
}

function doPause() {
    WorldManager.pause(true);
}

async function doUnpause() {
    if (PAUSE_MENU_OBJ.term.menu !== PAUSE_MENU) return;
    copyPreferences();
    await showManpage(false);
    WorldManager.pause(false);
}

export function copyPreferences() {
    if (!PAUSE_MENU_OBJ || PAUSE_MENU_OBJ.term.topMenu !== PAUSE_MENU) return;
    K.strings.controllerType = K.getValueFromMenu(PAUSE_MENU, "set controllerType");
    const switches = K.getValueFromMenu(PAUSE_MENU, "settings -i") as string[];
    timer.opacity = +switches?.includes("timer");
    musicPlay.paused = !switches?.includes("music");
    player.sfxEnabled = switches?.includes("sfx");
    K.rumble.enabled = switches?.includes("rumble");
    player.controlText.hidden = !switches?.includes("controlHints");
    const graphicsSwitches = K.getValueFromMenu(PAUSE_MENU, "settings -xg") as string[];
    enablePseudo3D(graphicsSwitches?.includes("pseudo3D"));
    K.langs = K.getValueFromMenu(PAUSE_MENU, "set language") as string[];
    if (debugSubmenu.hidden === K.debug.inspect) {
        debugSubmenu.hidden = !K.debug.inspect;
        PAUSE_MENU_OBJ.term.__redraw(false);
    }
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
        if (K.isTouchscreen()) {
            showManpage(true, "&msg.dialog.touchNotSupportedYet", false);
        }
    });
});
