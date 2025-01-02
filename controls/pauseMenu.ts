import { GameObj, Vec2 } from "kaplay";
import { PtyComp, PtyMenu, PtyMenuComp } from "../plugins/kaplay-pty";
import { player } from "../player";
import { K } from "../init";
import { timer } from "../ui/timer";
import { MParser } from "../assets/mparser";
import { DynamicTextComp } from "../plugins/kaplay-dynamic-text";
import { musicPlay } from "../assets";
import { guessOS, isFirefox, isTouchscreen, nextFrame } from "../utils";
import { showManpage } from ".";
import { detectGamepadType, isSingleJoyCon } from "./autodetectGamepad";

// save for autodetect
const availableLangs = K.langs.slice();

export const PAUSE_MENU: PtyMenu = {
    id: "sysctl",
    type: "submenu",
    opts: [
        {
            id: "settings -i",
            name: "&msg.pause.preferences",
            type: "select",
            opts: [
                { text: "&msg.pause.controllerRumble", value: "rumble" },
                { text: "&msg.pause.showSpeedrunTimer", value: "timer" },
                { text: "&msg.pause.showControlHints", value: "controlHints" },
                { text: "&msg.pause.playBgMusic", value: "music" },
                { text: "&msg.pause.playSfx", value: "sfx" },
            ],
            selected: [0, 1, 2, 3, 4],
            multiple: true
        },
        {
            id: "set controllerType",
            name: "&msg.pause.select",
            type: "select",
            opts: [
                { text: "Xbox   (&xbox.west &xbox.north &xbox.east &xbox.south, &xbox.select/&xbox.start)", value: "xbox" },
                { text: "Switch (&switch.west &switch.north &switch.east &switch.south, &switch.select/&switch.start)", value: "switch" },
                { text: "PS5    (&ps5.west &ps5.north &ps5.east &ps5.south, &ps5.select/&ps5.start)", value: "ps5" },
                { text: "PS4    (&ps4.west &ps4.north &ps4.east &ps4.south, &ps4.select/&ps4.start)", value: "ps4" },
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
        {
            id: "testing",
            name: "testing testing",
            prompt: "Enter an IP address:",
            type: "string",
            value: "0.0.0.0",
            validator: /^(\d{1,3}\.){3}\d{1,3}$/,
            invalidMsg: "Invalid IP address",
            hidden: true
        }
    ]
}

export var PAUSE_MENU_OBJ: GameObj<PtyMenuComp | PtyComp | DynamicTextComp>;
export var pauseListener = K.add([]);

// setup navigation controls
pauseListener.onButtonPress("nav_left", () => {
    if (K.isCapturingInput()) return;
    PAUSE_MENU_OBJ.switch(K.LEFT);
})
pauseListener.onButtonPress("nav_right", () => {
    if (K.isCapturingInput()) return;
    PAUSE_MENU_OBJ.switch(K.RIGHT);
})
pauseListener.onButtonPress("nav_up", () => {
    if (K.isCapturingInput()) return;
    PAUSE_MENU_OBJ.switch(K.UP);
})
pauseListener.onButtonPress("nav_down", () => {
    if (K.isCapturingInput()) return;
    PAUSE_MENU_OBJ.switch(K.DOWN);
})
pauseListener.onButtonPress("nav_select", () => {
    if (K.isCapturingInput()) return;
    PAUSE_MENU_OBJ.doit();
})
pauseListener.onButtonPress("nav_back", () => {
    if (K.isCapturingInput()) return;
    if (PAUSE_MENU_OBJ.backStack.length > 0) PAUSE_MENU_OBJ.back();
    else doUnpause();
});

var origCamPos: Vec2;
var origInventoryIndex: number;
player.onButtonPress("pause_unpause", doPause);
pauseListener.onButtonPress("pause_unpause", doUnpause);
pauseListener.onUpdate(() => {
    copyPreferences();
    player.controlText.data.stringEditing = String(!!K.isCapturingInput());
});
pauseListener.paused = true;

export function initPauseMenu(terminal: GameObj<PtyComp>) {
    // sync testing mode for music
    if (musicPlay.paused)
        // @ts-ignore
        PAUSE_MENU.opts[0].selected.splice(3, 1);
    // setup pause / unpause controls
    origCamPos = player.pos;
    origInventoryIndex = player.holdingIndex;

    // setup menu
    terminal.use(K.ptyMenu(PAUSE_MENU, {
        sounds: {
            switch: "footsteps",
            back: "switch_off",
            doit: "climbing",
            error: "command_fail",
            typing: "typing",
        },
        playSoundCb: sound => player.playSound(sound),
    }));

    // @ts-expect-error
    PAUSE_MENU_OBJ = terminal;

    copyPreferences();
}

async function doPause() {
    origInventoryIndex = player.holdingIndex;
    player.scrollInventory(-player.inventory.length);
    player.hidden = player.paused = true;
    K.get("tail").forEach(p => p.hidden = p.paused = true);
    origCamPos = player.pos;
    K.setCamPos(MParser.pausePos);
    await nextFrame();
    // prevent immediate unpause
    pauseListener.paused = false;
    player.playSound("typing");
    player.controlText.t = "&pauseMenuCtlHint";
    await PAUSE_MENU_OBJ.type("^Z\n[1]  + &startup.debugger.pid &msg.pause.suspended  &startup.cmd\n");
    await PAUSE_MENU_OBJ.beginMenu();
}

async function doUnpause() {
    if (K.isCapturingInput()) return;
    if (PAUSE_MENU_OBJ.menu !== PAUSE_MENU) return;
    player.hidden = player.paused = false;
    player.scrollInventory(origInventoryIndex - player.holdingIndex);
    K.get("tail").forEach(p => p.hidden = p.paused = false);
    pauseListener.paused = true;
    K.setCamPos(origCamPos);
    player.playSound("typing");
    await PAUSE_MENU_OBJ.quitMenu();
    await PAUSE_MENU_OBJ.command(
        { text: "fg %1", styles: ["command"] },
        "[1]  + &startup.debugger.pid &msg.pause.continued  &startup.cmd\n")
    copyPreferences();
    await showManpage(false);
}

export function copyPreferences() {
    if (!PAUSE_MENU_OBJ || PAUSE_MENU_OBJ.topMenu !== PAUSE_MENU) return;
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
    const id = navigator.getGamepads()[g.index]!.id;
    const which = detectGamepadType(id);
    if (which !== undefined) {
        // @ts-ignore
        PAUSE_MENU.opts[1].selected = PAUSE_MENU.opts[1].opts.findIndex(x => x.value === which);
        copyPreferences();
    }
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
