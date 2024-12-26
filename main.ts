import { K } from "./init";
import "./layers";

import "./assets/loadLevel";
import "./bsod";
import type { LinkComp } from "./components/linked";
import { GRAVITY } from "./constants";
import "./controls";
import "./controls/gamepadRumble";
import "./debugLinkage";
import { player } from "./player";
import "./player/states";
import "./player/health";
import "./ui";

K.setGravity(GRAVITY);

// @ts-ignore
window.playerFollower = player.camFollower!;
// @ts-ignore
window.player = player;

// @ts-ignore
window.openSesame = (id: string) => (K.get<LinkComp>("linked", { recursive: true }).find(x => x.linkGroup === id) ?? { broadcast() { throw "nothing with id " + id; } }).broadcast("toggle");
