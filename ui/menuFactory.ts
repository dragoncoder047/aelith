import { GameObj, PosComp, TextComp, Vec2 } from "kaplay";
import { UI } from ".";
import { STYLES } from "../assets/textStyles";
import { manpage, ManpageComp } from "../components/manpage";
import { MODIFY_SPEED } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { KEventControllerPatch } from "../plugins/kaplay-control-group";
import { DynamicTextComp } from "../plugins/kaplay-dynamic-text";
import { PtyChunk, PtyComp, PtyMenu, PtyMenuComp } from "../plugins/kaplay-pty";
import { nextFrame } from "../misc/utils";
import { MParser } from "../levels/mparser";

var getMotionVector: () => Vec2;
import("../controls").then(mod => getMotionVector = mod.getMotionVector);

export interface MenuModal {
    menu: PtyMenu
    term: GameObj<DynamicTextComp | PtyComp | PtyMenuComp | TextComp>
    modal: GameObj<ManpageComp>
    onStart(f: () => void): KEventControllerPatch
    onQuit(f: () => void): KEventControllerPatch
    onUpdate(f: () => void): KEventControllerPatch
    destroy(): void
    setupGroups(groups: string[]): void
    open(): Promise<void>
    close(): Promise<void>
}

export function modalmenu(theMenu: PtyMenu, initEv: string[], hint: string, enterEC: KEventControllerPatch, closeable: boolean = true, history: boolean = false): MenuModal {
    const THIS_MENU_ID = "___menu" + MParser.uid();
    var origInventoryIndex: number;
    const theMenuContainer = UI.add([
        K.pos(K.center()),
        K.layer("manpage"),
        {
            add(this: GameObj<PosComp>) {
                K.onTabResize(() => {
                    this.pos = K.center();
                });
            },
        }
    ]);
    const theModal = theMenuContainer.add([manpage()]);
    const theTerm = K.add([
        K.text("", { styles: STYLES }),
        K.dynamicText(),
        K.fixed(),
        K.anchor("botright"),
        K.pos(0, 0),
        K.pty({ cursor: { text: "\u2588", styles: ["cursor"] } }),
        K.ptyMenu(theMenu, {
            useHistory: history,
            sounds: {
                switch: "footsteps",
                back: "switch_off",
                doit: "climbing",
                error: "command_fail",
                typing: "typing",
            },
            playSoundCb: sound => player.playSound(sound),
        }),
    ]);
    theTerm.prompt = createPrompt();
    theTerm.paused = theTerm.hidden = true;
    theModal.paused = theModal.hidden = true;
    theModal.section = theModal.header = "";
    theModal.showFooter = false;
    const startEv = new K.KEvent;
    const quitEv = new K.KEvent;
    const updateEv = new K.KEvent;
    const handlers = {
        enter: [enterEC],
        exit: (closeable ? [
            theMenuContainer.onButtonPress("nav_back", () => {
                if (K.isCapturingInput()) return;
                if (theTerm.backStack.length > 0) theTerm.back();
                else theObj.close();
            }),
        ] : []) as KEventControllerPatch[],
        main: [
            ...(closeable ? [
                theMenuContainer.onButtonPress("edit", () => {
                    if (K.isCapturingInput()) return;
                    theObj.close();
                })
            ] : []),
            theMenuContainer.onButtonPress("nav_left", async () => {
                if (K.isCapturingInput()) return;
                await theTerm.switch(K.LEFT);
                theModal.scrollPos = Number.MAX_VALUE;
            }),
            theMenuContainer.onButtonPress("nav_right", async () => {
                if (K.isCapturingInput()) return;
                await theTerm.switch(K.RIGHT);
                theModal.scrollPos = Number.MAX_VALUE;
            }),
            theMenuContainer.onButtonPress("nav_up", async () => {
                if (K.isCapturingInput()) return;
                await theTerm.switch(K.UP);
                theModal.scrollPos = Number.MAX_VALUE;
            }),
            theMenuContainer.onButtonPress("nav_down", async () => {
                if (K.isCapturingInput()) return;
                await theTerm.switch(K.DOWN);
                theModal.scrollPos = Number.MAX_VALUE;
            }),
            theMenuContainer.onButtonPress("nav_select", async () => {
                if (K.isCapturingInput()) return;
                await theTerm.doit();
                theModal.scrollPos = Number.MAX_VALUE;
            }),
            theMenuContainer.onUpdate(() => {
                theModal.body = theTerm.text;
                theModal.header = theTerm.menu.name ?? "";
                if (theModal.needsToScroll)
                    theModal.scrollPos += getMotionVector().y * K.dt() * MODIFY_SPEED
                updateEv.trigger();
            }),
            theMenuContainer.onScroll(xy => {
                if (theModal.needsToScroll)
                    theModal.scrollPos += xy.y;
            }),
            theTerm.on("stringFinished", () => {
                theModal.scrollPos = Number.MAX_VALUE;
            }),
        ] as KEventControllerPatch[],
    };
    const theObj: MenuModal = {
        menu: theMenu,
        term: theTerm,
        modal: theModal,
        onStart(f) {
            return startEv.add(f) as KEventControllerPatch;
        },
        onQuit(f) {
            return quitEv.add(f) as KEventControllerPatch;
        },
        onUpdate(f) {
            return updateEv.add(f) as KEventControllerPatch;
        },
        destroy() {
            theMenuContainer.destroy();
            handlers.enter.forEach(h => h.cancel());
            handlers.exit.forEach(h => h.cancel());
            handlers.main.forEach(h => h.cancel());
            startEv.clear();
            quitEv.clear();
            updateEv.clear();
        },
        setupGroups(groups) {
            groups.push(THIS_MENU_ID);
            handlers.enter.forEach(h => h.forEventGroup(groups.map(g => `!${g.replace(/^!/, "")}`)));
            handlers.exit.forEach(h => h.forEventGroup(groups));
            handlers.main.forEach(h => h.forEventGroup(groups));
            initEv = groups;
        },
        async open() {
            theObj.term.paused = false;
            theObj.modal.paused = theObj.modal.hidden = false;
            await nextFrame();
            initEv.forEach(ev => K.eventGroups.add(ev));
            if (!history) theObj.term.chunks = [];
            origInventoryIndex = player.holdingIndex;
            player.scrollInventory(-player.inventory.length);
            player.hidden = true;
            player.freeze(true);
            K.get("tail").forEach(p => p.hidden = p.paused = true);
            player.playSound("typing");
            player.controlText.t = hint;
            await theObj.term.beginMenu();
            startEv.trigger();
        },
        async close() {
            initEv.forEach(ev => K.eventGroups.delete(ev));
            quitEv.trigger();
            theObj.term.paused = true;
            theObj.modal.paused = theObj.modal.hidden = true;
            await theObj.term.quitMenu();
            player.scrollInventory(origInventoryIndex - player.holdingIndex);
            player.hidden = false;
            player.freeze(false);
            K.get("tail").forEach(p => p.hidden = p.paused = false);
            player.playSound("typing");
        }
    }
    theObj.onUpdate(() => {
        player.controlText.data.stringEditing = String(!!K.isCapturingInput());
    });
    theObj.setupGroups(initEv);
    return theObj;
}

export function createPrompt(): PtyChunk[] {
    return [
        {
            text: "\u250C&user@dev ",
            styles: ["ident"],
        },
        {
            text: "/home/&user",
            styles: ["prompt"]
        },
        {
            text: "\n\u2514\u25BA$ ",
            styles: ["ident"],
        }
    ];
}
