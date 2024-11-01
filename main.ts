// cSpell: ignore kaplay

import { K } from "./init";
import "./layers";

import "./assets/loadLevel";
import "./bsod";
import { GRAVITY } from "./constants";
import "./debugLinkage";
import { player } from "./player";
import "./player/controls/impl";
import "./player/states";
import "./ui";
import { LinkComp } from "./components/linked";

K.setGravity(GRAVITY);
K.setLanguages(["en", "es"]);

// @ts-ignore
window.playerFollower = player.camFollower!;

// @ts-ignore
window.openSesame = (id: string) => (K.get<LinkComp>("linked", { recursive: true }).find(x => x.tag === id) ?? { broadcast() { throw "nothing with id " + id; } }).broadcast("toggle");
