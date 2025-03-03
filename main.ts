import { K } from "./init";
import "./layers";

import "./misc/bsod";
import type { LinkComp } from "./components/linked";
import { GRAVITY } from "./constants";
import "./controls";
import "./controls/gamepadRumble";
import { initPauseMenu } from "./controls/pauseMenu";
import "./debugLinkage";
import { player } from "./player";
import "./player/health";
import "./player/states";
import "./ui";
import("./.p");

K.setGravity(GRAVITY);

// TODO: load first level

initPauseMenu();

// @ts-ignore
window.playerFollower = player.camFollower!;
// @ts-ignore
window.player = player;

// @ts-ignore
window.openSesame = (id: string) => (K.get<LinkComp>("linked", { recursive: true }).find(x => x.linkGroup === id) ?? { broadcast() { throw "nothing with id " + id; } }).broadcast("toggle");
