import { GameObj } from "kaplay";
import { PtyComp, PtyMenu, PtyMenuComp } from "../plugins/kaplay-pty";
import { player } from "../player";
import { K } from "../init";
import { timer } from "../ui/timer";
import { MParser } from "../assets/mparser";
import { DynamicTextComp } from "../plugins/kaplay-dynamic-text";
import { musicPlay } from "../assets";
import { nextFrame } from "../utils";

// save for autodetect
const availableLangs = K.langs.slice();

export const PAUSE_MENU: PtyMenu = {
    id: "sysctl",
    type: "submenu",
    opts: [
        {
            id: "set controllerType",
            name: "&msg.pause.select",
            type: "select",
            opts: [
                { text: "Xbox   (&xbox.west &xbox.north &xbox.east &xbox.south, &xbox.select/&xbox.start)", value: "xbox" },
                { text: "PS5    (&ps5.west &ps5.north &ps5.east &ps5.south, &ps5.select/&ps5.start)", value: "ps5" },
                { text: "PS4    (&ps4.west &ps4.north &ps4.east &ps4.south, &ps4.select/&ps4.start)", value: "ps4" },
                { text: "Switch (&switch.west &switch.north &switch.east &switch.south, &switch.select/&switch.start)", value: "switch" },
            ],
            selected: 0
        },
        {
            id: "set language",
            name: "&msg.pause.setLanguage",
            type: "select",
            opts: [
                { text: "&msg.pause.automaticLang", value: availableLangs },
                { text: "English", value: ["en"] },
                { text: "Español", value: ["es"] }
            ],
            selected: 0
        },
        {
            id: "settings -i",
            name: "&msg.pause.preferences",
            type: "select",
            opts: [
                { text: "&msg.pause.controllerRumble", value: "rumble", hidden: true },
                { text: "&msg.pause.showSpeedrunTimer", value: "timer" },
                { text: "&msg.pause.playBgMusic", value: "music" },
                { text: "&msg.pause.playSfx", value: "sfx" },
            ],
            selected: [0, 1, 2, 3],
            multiple: true
        },
        {
            id: "ng-connect",
            name: "&msg.pause.ngConnect",
            type: "action",
            async action() {
                await PAUSE_MENU_OBJ.type({ text: "&msg.notImplemented\n", styles: ["stderr"] });
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
                        await PAUSE_MENU_OBJ.quitMenu();
                        window.location.reload();
                    }
                }
            ]
        },
    ]
}

export var PAUSE_MENU_OBJ: GameObj<PtyMenuComp | PtyComp | DynamicTextComp>;
export var pauseListener: GameObj;

export function initPauseMenu(terminal: GameObj<PtyComp>) {
    // setup pause / unpause controls
    var origCamPos = player.pos;
    pauseListener = K.add([]);
    player.onButtonPress("pause_unpause", async () => {
        player.hidden = player.paused = true;
        K.get("tail").forEach(p => p.hidden = p.paused = true);
        origCamPos = player.pos;
        K.camPos(MParser.pausePos);
        await nextFrame();
        // prevent immediate unpause
        pauseListener.paused = false;
        await onPaused();
    });
    pauseListener.onButtonPress("pause_unpause", async () => {
        if (PAUSE_MENU_OBJ.menu !== PAUSE_MENU) return;
        K.get("player").forEach(p => p.hidden = p.paused = false);
        K.get("tail").forEach(p => p.hidden = p.paused = false);
        pauseListener.paused = true;
        K.camPos(origCamPos);
        await onUnpaused();
    });
    pauseListener.paused = true;
    pauseListener.onUpdate(() => {
        copyPreferences();
    });

    // setup menu
    terminal.use(K.ptyMenu(PAUSE_MENU, {
        sounds: {
            switch: "footsteps",
            back: "switch_off",
            doit: "climbing",
            error: "command_fail"
        },
    }));

    // setup navigation controls
    pauseListener.onButtonPress("nav_left", () => PAUSE_MENU_OBJ.switch(K.LEFT))
    pauseListener.onButtonPress("nav_right", () => PAUSE_MENU_OBJ.switch(K.RIGHT))
    pauseListener.onButtonPress("nav_up", () => PAUSE_MENU_OBJ.switch(K.UP))
    pauseListener.onButtonPress("nav_down", () => PAUSE_MENU_OBJ.switch(K.DOWN))
    pauseListener.onButtonPress("nav_select", () => PAUSE_MENU_OBJ.doit())
    pauseListener.onButtonPress("nav_back", () => {
        if (PAUSE_MENU_OBJ.backStack.length > 0) PAUSE_MENU_OBJ.back();
        else {
            // trigger an unpause
            K.pressButton("pause_unpause");
            K.releaseButton("pause_unpause");
        }
    })

    // @ts-expect-error
    PAUSE_MENU_OBJ = terminal;

    K.strings.isPaused = "0";
    copyPreferences();
}

async function onPaused() {
    K.strings.isPaused = "1";
    await PAUSE_MENU_OBJ.type("^Z\n[1]  + 4247 &msg.pause.suspended  gdb pm 4242.core\n");
    await PAUSE_MENU_OBJ.beginMenu();
}

async function onUnpaused() {
    await PAUSE_MENU_OBJ.quitMenu();
    await PAUSE_MENU_OBJ.command(
        { text: "fg %1", styles: ["command"] },
        "[1]  + 4247 &msg.pause.continued  gdb pm 4242.core\n")
    copyPreferences();
    K.strings.isPaused = "0";
}

export function copyPreferences() {
    if (PAUSE_MENU_OBJ.topMenu !== PAUSE_MENU) return;
    K.strings.controllerType = K.getValueFromMenu(PAUSE_MENU, "set controllerType");
    const switches = K.getValueFromMenu(PAUSE_MENU, "settings -i");
    timer.opacity = +switches?.includes("timer");
    musicPlay.paused = !switches?.includes("music");
    player.sfxEnabled = switches?.includes("sfx");
    K.langs = K.getValueFromMenu(PAUSE_MENU, "set language");
}
