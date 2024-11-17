import { GameObj, Vec2 } from "kaplay";
import { PtyComp, PtyMenu, PtyMenuComp } from "../plugins/kaplay-pty";
import { player } from "../player";
import { K } from "../init";

const PAUSE_MENU: PtyMenu = {
    id: "sysctl",
    type: "submenu",
    opts: [
        {
            id: "setController",
            name: "switch controller type",
            type: "select",
            opts: [
                { text: "Xbox            (X Y B A)", value: "xbox" },
                { text: "Playstation     (\u2588 \u25B2 \u25CB X)", value: "playstation" },
                { text: "Nintendo Switch (Y X A B)", value: "switch" },
            ],
            selected: 0,
        },
        {
            id: "login",
            name: "Login to Newgrounds.com",
            type: "action",
            async action() {
                await PAUSE_MENU_OBJ.type({ text: "Not implemented yet, sorry\n", styles: ["stderr"] });
            }
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
        await K.wait(0.1);
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

    // setup menu
    terminal.use(K.ptyMenu(PAUSE_MENU, {
        playSoundCb: K.debug.log,
        sounds: {
            switch: "switch",
            back: "back",
            doit: "doit",
            error: "error"
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

    copyPreferences();
}

async function onPaused() {
    await PAUSE_MENU_OBJ.type("^Z\n[1]  + 4247 suspended  gdb pm 4242.core\n");
    await PAUSE_MENU_OBJ.beginMenu();
}

async function onUnpaused() {
    await PAUSE_MENU_OBJ.quitMenu();
    await PAUSE_MENU_OBJ.command(
        { text: "fg %1", styles: ["command"] },
        "[1]  + 4247 continued  gdb pm 4242.core\n")
    copyPreferences();
}

function copyPreferences() {

}
