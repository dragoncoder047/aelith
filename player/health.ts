import { GameObj, NamedComp } from "kaplay";
import { player } from ".";
import { musicPlay } from "../assets";
import { ContinuationComp } from "../components/continuationCore";
import { FALL_DAMAGE_THRESHOLD, MAX_FALL_DAMAGE, TERMINAL_VELOCITY } from "../constants";
import { copyPreferences } from "../controls/pauseMenu";
import { K } from "../init";
import { WorldManager } from "../levels";
import { splash } from "../misc/particles";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";
import { PtyMenu } from "../plugins/kaplay-pty";
import { TextChunk, typeChunks } from "../transitions";
import { modalmenu } from "../ui/menuFactory";

const deathMessages: TextChunk[] = [
    {
        value: "\n&msg.dead.complete\n"
    },
    {
        value: {
            text: "agdb: error: &msg.dead.failed\n",
            styles: ["stderr"],
            sound: "command_fail"
        }
    },
];

const resumeEntry: PtyMenu = {
    id: "resume",
    name: "&msg.dead.resume",
    type: "submenu",
    opts: [],
};

const DEATH_MENU: PtyMenu = {
    id: "sysctl",
    type: "submenu",
    opts: [
        resumeEntry,
        {
            id: "restart",
            name: "&msg.pause.restart &msg.dead.fromBeginning",
            type: "action",
            async action() {
                await DEATH_MENU_OBJ.term.quitMenu();
                window.location.reload();
            }
        }
    ]
};

const DUMMY = new K.KEvent;
const DEATH_MENU_OBJ = modalmenu(DEATH_MENU, ["menuActive", "deathMenu"], "&deathMenuCtlHint",
    DUMMY.add(() => { }) as KEventControllerPatch, false, true);
DEATH_MENU_OBJ.modal.bg = K.BLACK;

player.onGround(() => {
    if (player.vel.y > FALL_DAMAGE_THRESHOLD)
        player.hurt(K.map(player.vel.y - FALL_DAMAGE_THRESHOLD, 0, TERMINAL_VELOCITY, 0, MAX_FALL_DAMAGE));
});

player.onHurt(() => {
    if (player.hp > 0) {
        player.flash();
        K.shake();
        K.play("hurt");
        splash(player.pos, K.RED, 30);
    }
})

player.onDeath(async () => {
    resumeEntry.opts = []; // clear in case user died twice
    musicPlay.paused = true;
    K.play("die");
    WorldManager.pause(true);
    player.scrollInventory(-player.inventory.length);
    player.update();
    K.get("tail").forEach(t => t.paused = true);
    await K.tween(1, 0, 2, o => player.opacity = o);
    player.hidden = true;
    player.opacity = 1;
    DEATH_MENU_OBJ.term.chunks = [];
    await typeChunks(DEATH_MENU_OBJ.term, deathMessages, false);
    WorldManager.activeLevel!.levelObj.update();
    // make resume things
    const allContinuations = K.get<ContinuationComp | NamedComp>("continuation", { only: "comps", recursive: true }).filter(x => x.name === "assert");
    allContinuations.sort((a, b) => a.timestamp - b.timestamp);
    const divBy = 5;
    if (allContinuations.length === 0) {
        resumeEntry.hidden = true;
    } else {
        resumeEntry.hidden = false;
        var thisList: PtyMenu[] = [];
        var lastI = 0;
        for (var i = 0; i < allContinuations.length; i++) {
            const thisCont = allContinuations[i] as unknown as GameObj<ContinuationComp>;
            const resumeFromThis = makeResumer(thisCont);
            thisList.push({
                id: "" + i,
                type: "action",
                name: `&msg.dead.checkpoint #${i + 1}`,
                action: resumeFromThis,
            });
            if (thisList.length % divBy === 0) {
                resumeEntry.opts.push({
                    id: "",
                    type: "submenu",
                    name: `&msg.dead.checkpoints #${lastI + 1}-#${i + 1}`,
                    opts: thisList,
                });
                thisList = [];
                lastI = i + 1;
            }
        };
        if (thisList.length > 0) {
            resumeEntry.opts.push({
                id: "",
                type: "submenu",
                name: `&msg.dead.checkpoints #${lastI + 1}-#${allContinuations.length}`,
                opts: thisList,
            });
        }
        if (allContinuations.length > 0 && allContinuations.length <= divBy) {
            // @ts-expect-error
            resumeEntry.opts = resumeEntry.opts[0]!.opts;
        }
    }
    // we are hijacking the pause menu yay!
    player.controlText.data.stringEditing = "false";
    await DEATH_MENU_OBJ.open();
    DEATH_MENU_OBJ.modal.scrollPos = Number.MAX_VALUE;
});

function makeResumer(c: GameObj<ContinuationComp>): () => Promise<void> {
    return async () => {
        await DEATH_MENU_OBJ.close();
        WorldManager.pause(false);
        player.hidden = false;
        copyPreferences();
        K.eventGroups.delete("menuActive");
        K.eventGroups.delete("pauseMenu");
        K.get("tail").forEach(t => t.paused = false);
        c.invoke();
        K.loop(0.1, () => {
            const speed = K.rand(1, 2);
            splash(player.pos, () => K.Color.fromHSL((K.time() * speed) % 1, 1, 1 / 2), undefined, undefined, [], 0.2, 0.2);
        }, 10);
    };
}

// K.onKeyPress("`", () => {
//     player.hurt(player.hp);
// });
