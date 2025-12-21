import { K } from "../context";
import * as PlatformGuesser from "../PlatformGuesser";
import { Room } from "../room/Room";
import { Menu, MenuItem, MenuItemType } from "../scenes/menus/types";
import { Scene } from "../scenes/SceneManager";
import { Settings } from "../settings";

export const SYSTEM_SETTINGS = new Settings("aelith_local_settings");

// TODO: implement the rest of these
SYSTEM_SETTINGS.addBoolean("renderLights", true);
SYSTEM_SETTINGS.addBoolean("renderDepth", true).onChange(v => Room._depthEnabled = v);
SYSTEM_SETTINGS.addSelect("controllerType", "ps5", ["xbox", "switch", "ps4", "ps5"]).onChange(v => PlatformGuesser.changeGamepadType(v));
SYSTEM_SETTINGS.addBoolean("controllerRumble", true).onChange(v => K.rumble.enabled = v);
SYSTEM_SETTINGS.addSelect("language", "auto", ["auto", "en", "es"]).onChange(v => K.useLanguage(v === "auto" ? null : v));
SYSTEM_SETTINGS.addRange("musicVolume", 1, 0, 1);
SYSTEM_SETTINGS.addRange("sfxVolume", 1, 0, 1);
SYSTEM_SETTINGS.addBoolean("debugInspect", false).onChange(v => K.debug.inspect = v);
SYSTEM_SETTINGS.addBoolean("debugFPSGraph", true);

const mmo = (s: string) => `&msg.menu.options.${s}`;
const mmp = (s: string) => `&msg.menu.pause.${s}`;

export const SYSTEM_MENUS: Record<string, Menu> = {
    settings: {
        title: mmo("title"),
        options: [
            {
                type: MenuItemType.SUBMENU,
                next: "graphicsSettings",
                text: mmo("graphics.title")
            },
            {
                type: MenuItemType.SUBMENU,
                next: "audioSettings",
                text: mmo("audio.title")
            },
            {
                type: MenuItemType.SUBMENU,
                next: "controllerSettings",
                text: mmo("controller.title")
            },
            {
                type: MenuItemType.SUBMENU,
                next: "languageSettings",
                text: mmo("language.title")
            },
            {
                type: MenuItemType.SUBMENU,
                next: "debugSettings",
                text: mmo("debug.title")
            },
        ]
    },
    graphicsSettings: {
        title: mmo("graphics.title"),
        options: [
            {
                type: MenuItemType.TEXT,
                text: mmo("graphics.potato")
            },
            {
                type: MenuItemType.SETTING,
                text: mmo("graphics.lights.name"),
                setting: "renderLights",
                help: mmo("graphics.lights.help"),
            },
            {
                type: MenuItemType.SETTING,
                text: mmo("graphics.depth.name"),
                setting: "renderDepth",
                help: mmo("graphics.depth.help"),
            }
        ]
    },
    languageSettings: {
        title: mmo("language.title"),
        options: [
            {
                type: MenuItemType.SETTING,
                text: "",
                setting: "language",
                help: mmo("language.info"),
                optionTextMap: {
                    en: "English",
                    es: "Español", // cSpell: ignore Español
                    auto: mmo("language.autodetect")
                }
            }
        ]
    },
    controllerSettings: {
        title: mmo("controller.title"),
        options: [
            {
                type: MenuItemType.SETTING,
                text: mmo("controller.rumble.name"),
                setting: "controllerRumble",
                help: mmo("controller.rumble.help")
            },
            {
                type: MenuItemType.SETTING,
                text: mmo("controller.type.name"),
                setting: "controllerType",
                help: mmo("controller.type.help"),
                optionTextMap: Object.fromEntries(["Xbox", "Switch", "PS4", "PS5"].map(name => {
                    const value = name.toLowerCase();
                    return [value, `${name.padEnd(7, " ")}(${[..."WNES, e/t"].map(c => /[a-z]/i.test(c) ? ` [font_${value}]${c}[/font_${value}] ` : c).join("")})`]
                }))
            }
        ]
    },
    audioSettings: {
        title: mmo("audio.title"),
        options: [
            {
                type: MenuItemType.SETTING,
                text: mmo("audio.musicVolume.name"),
                setting: "musicVolume",
                help: mmo("audio.musicVolume.help"),
                formatValue: toPercent,
            },
            {
                type: MenuItemType.SETTING,
                text: mmo("audio.sfxVolume.name"),
                setting: "sfxVolume",
                help: mmo("audio.sfxVolume.help"),
                formatValue: toPercent,
            }
        ]
    },
    debugSettings: {
        title: mmo("debug.title"),
        options: [
            {
                type: MenuItemType.SETTING,
                text: mmo("debug.inspectView.name"),
                setting: "debugInspect",
                help: mmo("debug.inspectView.help"),
                altDisplay: true
            },
            {
                type: MenuItemType.SETTING,
                text: mmo("debug.fpsGraph.name"),
                setting: "debugFPSGraph",
                help: mmo("debug.fpsGraph.help"),
                altDisplay: true
            },
            {
                type: MenuItemType.SUBMENU,
                next: "debugLongMenu",
                text: mmo("debug.long.button")
            },
            {
                type: MenuItemType.BUTTON,
                help: mmo("debug.crash.help"),
                text: mmo("debug.crash.name"),
                action() {
                    throw new Error("deliberate error");
                }
            }
        ]
    },
    debugLongMenu: {
        title: mmo("debug.long.title"),
        options: new Array(41).fill(0).map((_, i) => i % 5 > 0 ? ({
            type: MenuItemType.TEXT,
            text: mmo("debug.long.dummy") + " " + i,
        }) : ({
            type: MenuItemType.BUTTON,
            text: mmo("debug.long.dummy") + " " + i,
            help: "",
            action() { }
        })),
    },
    // Pause menu
    paused: {
        title: mmp("title"),
        options: [
            {
                type: MenuItemType.SUBMENU,
                text: mmo("title"),
                next: "settings"
            },
            {
                type: MenuItemType.BUTTON,
                text: mmp("quitToTitle"),
                help: "",
                action() {
                    K.go(Scene.TITLE_SCREEN);
                },
            }
        ]
    }
}

// install back buttons in everything
for (var key of Object.keys(SYSTEM_MENUS)) {
    SYSTEM_MENUS[key]!.options.push({
        text: key === "paused" ? "&msg.menu.pause.resume" : "&msg.menu.back",
        type: MenuItemType.BACK,
    });
}

function toPercent(x: number): string {
    return `${(x * 100).toFixed(0)}%`;
}
