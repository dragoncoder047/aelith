// cSpell: ignore kaplay

import { K } from "./init";
import "./bsod";
import "./layers";

import "./assets/loadLevel";
import { GRAVITY } from "./constants";
import { player } from "./player";
import "./player/controls/impl";
import "./player/states";
import "./ui";

K.setGravity(GRAVITY);
K.setLanguages(["en", "es"]);
const follower = player.camFollower!;
