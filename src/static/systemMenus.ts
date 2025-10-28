import { K } from "../context";
import { Menu, MenuItemType } from "../scenes/menus/types";
import { Settings } from "../settings";

export const SYSTEM_SETTINGS = new Settings("aelith_local_settings");

// TODO: use these settings
SYSTEM_SETTINGS.addBoolean("renderLights", true);
SYSTEM_SETTINGS.addBoolean("renderDepth", true);
SYSTEM_SETTINGS.addBoolean("speedrunTimer", true);
SYSTEM_SETTINGS.addSelect("controllerType", "ps5", ["xbox", "switch", "ps4", "ps5"]);
SYSTEM_SETTINGS.addBoolean("controllerRumble", true);
SYSTEM_SETTINGS.addSelect("language", "auto", ["auto", "en", "es"]).onChange(v => K.useLanguage(v === "auto" ? null : v));
SYSTEM_SETTINGS.addRange("musicVolume", 1, 1, 0);
SYSTEM_SETTINGS.addRange("sfxVolume", 1, 1, 0);
SYSTEM_SETTINGS.addBoolean("debugInspect", false).onChange(v => K.debug.inspect = v);

const mms = (s: string) => `&msg.menu.settings.${s}`;

export const SYSTEM_MENUS: Record<string, Menu> = {
    main: {
        title: mms("title"),
        options: [
            {
                type: MenuItemType.SUBMENU,
                next: "graphicsSettings",
                text: mms("graphics.title")
            },
            {
                type: MenuItemType.SUBMENU,
                next: "audioSettings",
                text: mms("audio.title")
            },
            {
                type: MenuItemType.SUBMENU,
                next: "controllerSettings",
                text: mms("controller.title")
            },
            {
                type: MenuItemType.SUBMENU,
                next: "languageSettings",
                text: mms("language.title")
            },
            {
                type: MenuItemType.SUBMENU,
                next: "debugSettings",
                text: mms("debug.title")
            },
        ]
    },
    graphicsSettings: {
        title: mms("graphics.title"),
        options: [
            {
                type: MenuItemType.SETTING,
                text: mms("graphics.speedrunTimer"),
                setting: "speedrunTimer",
                help: mms("graphics.infoSpeedrunTimer")
            },
            {
                type: MenuItemType.TEXT,
                text: mms("graphics.potato")
            },
            {
                type: MenuItemType.SETTING,
                text: mms("graphics.renderLights"),
                setting: "renderLights",
                help: mms("graphics.infoRenderLights"),
            },
            {
                type: MenuItemType.SETTING,
                text: mms("graphics.renderDepth"),
                setting: "renderDepth",
                help: mms("graphics.infoRenderDepth"),
            }
        ]
    },
    languageSettings: {
        title: mms("language.title"),
        options: [
            {
                type: MenuItemType.SETTING,
                text: "",
                setting: "language",
                help: mms("language.info"),
                optionTextMap: {
                    en: "English",
                    es: "Español", // cSpell: ignore Español
                    auto: mms("language.autodetect")
                }
            }
        ]
    },
    controllerSettings: {
        title: mms("controller.title"),
        options: [
            {
                type: MenuItemType.SETTING,
                text: mms("controller.rumble"),
                setting: "controllerRumble",
                help: mms("controller.infoRumble")
            },
            {
                type: MenuItemType.SETTING,
                text: mms("controller.type"),
                setting: "controllerType",
                help: mms("controller.infoType"),
                optionTextMap: Object.fromEntries(["Xbox", "Switch", "PS4", "PS5"].map(name => {
                    const value = name.toLowerCase();
                    return [value, `${name.padEnd(7, " ")}(${[..."WNES, e/t"].map(c => /[a-z]/i.test(c) ? ` [font_${value}]${c}[/font_${value}] ` : c).join("")})`]
                }))
            }
        ]
    },
    audioSettings: {
        title: mms("audio.title"),
        options: [
            {
                type: MenuItemType.SETTING,
                text: mms("audio.musicVolume"),
                setting: "musicVolume",
                help: mms("audio.infoMusicVolume"),
            },
            {
                type: MenuItemType.SETTING,
                text: mms("audio.sfxVolume"),
                setting: "sfxVolume",
                help: mms("audio.infoSfxVolume"),
            }
        ]
    },
    debugSettings: {
        title: mms("debug.title"),
        options: [
            {
                type: MenuItemType.SETTING,
                text: mms("debug.inspectView"),
                setting: "debugInspect",
                help: mms("debug.infoInspectView"),
                altDisplay: true
            }
        ]
    }
}

// install back buttons in everything
for (var key of Object.keys(SYSTEM_MENUS)) {
    SYSTEM_MENUS[key]!.options.push({
        text: "&msg.menu.back",
        type: MenuItemType.BACK,
    });
}
