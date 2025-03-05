import { K } from "./init";
import "./layers";

import allLevels from "./assets/level_maps/ALL.json" with { type: "json" };
import type { LinkComp } from "./components/linked";
import { GRAVITY } from "./constants";
import "./controls";
import "./controls/gamepadRumble";
import { initPauseMenu } from "./controls/pauseMenu";
import "./debugLinkage";
import { WorldManager } from "./levels";
import "./misc/bsod";
import { player } from "./player";
import "./player/health";
import "./player/states";
import "./stats_tracker";
import "./ui";
import("./.p");

K.setGravity(GRAVITY);

K.onLoad(() => {
    player.paused = true;
    K.setCamPos(K.vec2(16384, 16384));
    for (var [name, world] of Object.entries(allLevels))
        WorldManager.loadLevel(name, world, K._k.globalOpt.debug ? -1 : 0);
    WorldManager.goLevel("0", false, false, true);
});

initPauseMenu();

// @ts-ignore
window.playerFollower = player.camFollower!;
// @ts-ignore
window.player = player;
// @ts-ignore
window.WorldManager = WorldManager;

// @ts-ignore
window.openSesame = (id: string) => (K.get<LinkComp>("linked", { recursive: true }).find(x => x.linkGroup === id) ?? { broadcast() { throw "nothing with id " + id; } }).broadcast("toggle");
