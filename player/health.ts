import { GameObj } from "kaplay";
import { player } from ".";
import { musicPlay } from "../assets";
import { MParser } from "../assets/mparser";
import { ContinuationComp } from "../components/continuationCore";
import { PAUSE_MENU, PAUSE_MENU_OBJ, pauseListener } from "../controls/pauseMenu";
import { K } from "../init";
import { PtyMenu } from "../plugins/kaplay-pty";
import { funnyType, TextChunk } from "../startup";
import { FALL_DAMAGE_THRESHOLD, MAX_FALL_DAMAGE, TERMINAL_VELOCITY } from "../constants";

const deathMessages: TextChunk[] = [
    {
        value: "\n&msg.dead.complete\n"
    },
    {
        value: {
            text: "gdb: error: &msg.dead.failed\n",
            styles: ["stderr"],
            sound: "command_fail"
        }
    },
];

const resumeList: PtyMenu[] = [];

const DEATH_MENU: PtyMenu = {
    id: "sysctl",
    type: "submenu",
    opts: [
        {
            id: "resume",
            name: "&msg.dead.resume",
            type: "submenu",
            opts: resumeList,
        },
        {
            id: "restart",
            name: "&msg.pause.restart &msg.dead.fromBeginning",
            type: "action",
            async action() {
                window.location.reload();
            }
        }
    ]
};

player.onGround(() => {
    if (player.vel.y > FALL_DAMAGE_THRESHOLD)
        player.hurt(K.map(player.vel.y - FALL_DAMAGE_THRESHOLD, 0, TERMINAL_VELOCITY, 0, MAX_FALL_DAMAGE));
});

player.onHurt(() => {
    K.play("hurt");
})

player.onDeath(async () => {
    resumeList.length = 0; // clear in case user died twice
    musicPlay.paused = true;
    K.play("die");
    MParser.pauseWorld(true);
    player.scrollInventory(-Infinity);
    player.trigger("update");
    player.paused = true;
    await K.tween(1, 0, 2, x => player.opacity = x);
    K.get("tail").forEach(t => t.paused = true);
    K.camPos(MParser.pausePos);
    await funnyType(PAUSE_MENU_OBJ, deathMessages);
    PAUSE_MENU_OBJ.menu = DEATH_MENU;
    K.strings.isPaused = "1";
    // make resume things
    const allContinuations = player.inventory.filter(x => x.is("continuation") && x.name === "assert");
    const divBy = 5;
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
            resumeList.push({
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
        resumeList.push({
            id: "",
            type: "submenu",
            name: `&msg.dead.checkpoint #${lastI + 1}-#${allContinuations.length}`,
            opts: thisList,
        });
    }
    if (allContinuations.length > 0 && allContinuations.length <= divBy) {
        // @ts-ignore
        const inner: PtyMenu[] = resumeList[0]!.opts;
        resumeList.length = 0;
        resumeList.push(...inner);
    }
    pauseListener.paused = false;
    await PAUSE_MENU_OBJ.beginMenu();
});

function makeResumer(c: GameObj<ContinuationComp>): () => Promise<void> {
    return async () => {
        pauseListener.paused = true;
        await PAUSE_MENU_OBJ.quitMenu();
        musicPlay.paused = false;
        MParser.pauseWorld(false);
        K.strings.isPaused = "0";
        PAUSE_MENU_OBJ.menu = PAUSE_MENU;
        player.paused = false;
        K.get("tail").forEach(t => {
            t.paused = false;
            t.opacity = 1;
        });
        player.opacity = 1;
        c.invoke();
    };
}
