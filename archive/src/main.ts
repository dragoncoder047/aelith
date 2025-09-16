import { K } from "./init";
import "./layers";

import { musicPlay } from "./assets";
import type { LinkComp } from "./components/linked";
import { GRAVITY } from "./constants";
import "./controls";
import "./controls/gamepadRumble";
import { initPauseMenu } from "./controls/pauseMenu";
import "./debugLinkage";
import { WorldManager } from "./levels";
import "./misc/bsod";
import "./misc/loading";
import { player } from "./player";
import "./player/health";
import "./player/states";
import "./stats_tracker";
import "./ui";
import "./.p";

K.setGravity(GRAVITY);

K.onLoad(() => {
    player.freeze(true);
    initPauseMenu();
    K.setCamPos(K.vec2(16384, 16384));
    WorldManager.goLevel("start", true).then(() => {
        musicPlay.paused = K._k.globalOpt.debug !== false;
    });
});

// @ts-expect-error
window.K = K;
// @ts-ignore
window.playerFollower = player.camFollower!;
// @ts-ignore
window.player = player;
// @ts-ignore
window.WorldManager = WorldManager;
