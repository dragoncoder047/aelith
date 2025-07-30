// These mean nothing, just for fun ;)

import { GameObj } from "kaplay";
import { TogglerComp } from "../components/toggler";
import { K } from "../init";
import { PtyMenu } from "../plugins/kaplay-pty";

const stats: Record<
    | "deaths"
    | "continuations_invoked"
    | "bugs_stomped"
    | "levers_switched"
    | "lightbulbs_illuminated"
    | "boxes_cloned", number | undefined> = {
    deaths: undefined,
    continuations_invoked: undefined,
    bugs_stomped: undefined,
    levers_switched: undefined,
    lightbulbs_illuminated: undefined,
    boxes_cloned: undefined,
}

const entriesDisplays: [keyof typeof stats, string, boolean][] = [
    ["deaths", "&msg.pause.stats.deaths", false],
    ["continuations_invoked", "&msg.pause.stats.continuations_invoked", false],
    ["bugs_stomped", "&msg.pause.stats.bugs_stomped", false],
    ["levers_switched", "&msg.pause.stats.levers_switched", false],
    ["lightbulbs_illuminated", "&msg.pause.stats.lightbulbs_illuminated", true],
    ["boxes_cloned", "&msg.pause.stats.boxes_cloned", false],
];

const menuViewer: PtyMenu = {
    type: "submenu",
    id: "easter",
    name: "&msg.pause.stats.heading",
    opts: [],
}

export const StatTracker = {
    stats,
    menuViewer,
    bump(which: keyof typeof stats, by = 1) {
        this.stats[which] ??= 0;
        this.stats[which] += by;
        this.updateMenu();
    },
    updateMenu() {
        var s = [];
        const nl = K.get("light", { recursive: true }).length;
        for (var [st, n, itl] of entriesDisplays) {
            if (this.stats[st] !== undefined)
                s.push(`${this.stats[st]}${itl ? `/${nl}` : ""} ${n}`);
        }
        if (s.length === 0)
            s.push("&msg.pause.stats.none");
        this.menuViewer.header = s.join("\n");
    }
};

StatTracker.updateMenu();

K.on("start_as_clone", "box", () => {
    StatTracker.bump("boxes_cloned");
});

K.on("invoke", "continuation", () => {
    StatTracker.bump("continuations_invoked");
});

K.on("stomped_by_player", "bug", () => {
    StatTracker.bump("bugs_stomped");
});

K.on("pull", "lever", () => {
    StatTracker.bump("levers_switched");
});

K.on("toggle", "light", (l: GameObj<TogglerComp>) => {
    StatTracker.bump("lightbulbs_illuminated", l.togglerState ? 1 : -1);
});
