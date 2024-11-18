import { GameObj, Vec2 } from "kaplay";
import { PtyComp, PtyMenu, PtyMenuComp } from "../plugins/kaplay-pty";
import { player } from "../player";
import { K } from "../init";
import { timer } from "../ui/timer";

// save for autodetect
const availableLangs = K.langs.slice();

const PAUSE_MENU: PtyMenu = {
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
            id: "set",
            name: "&msg.pause.preferences",
            type: "select",
            opts: [
                // { text: "&msg.pause.controllerRumble", value: "rumble" },
                { text: "&msg.pause.showSpeedrunTimer", value: "timer" },
            ],
            selected: [],
            multiple: true
        },
        // {
        //     id: "ng-connect",
        //     name: "&msg.pause.ngConnect",
        //     type: "action",
        //     async action() {
        //         await PAUSE_MENU_OBJ.type({ text: "&msg.notImplemented\n", styles: ["stderr"] });
        //     }
        // },
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
                        window.location.reload();
                    }
                }
            ]
        }
    ]
}

export var PAUSE_MENU_OBJ: GameObj<PtyMenuComp | PtyComp>;

export function initPauseMenu(terminal: GameObj<PtyComp>, pauseCamPos: Vec2) {
    // setup pause / unpause controls
    var origCamPos = pauseCamPos;
    const pauseListener = K.add([]);
    player.onButtonPress("pause_unpause", async () => {
        K.debug.log("pausing");
        K.get("player").forEach(p => p.hidden = p.paused = true);
        K.get("tail").forEach(p => p.hidden = p.paused = true);
        origCamPos = player.pos;
        K.camPos(pauseCamPos);
        await K.wait(0.05);
        // prevent immediate unpause
        pauseListener.paused = false;
        await onPaused();
    });
    pauseListener.onButtonPress("pause_unpause", async () => {
        K.debug.log("unpausing");
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

function copyPreferences() {
    K.strings.controllerType = PAUSE_MENU_OBJ.value("set controllerType");
    timer.opacity = +PAUSE_MENU_OBJ.value("set").includes("timer");
    K.langs = PAUSE_MENU_OBJ.value("set language");
}
