// cSpell: ignore kaplay

import { K } from "./init";
import "./layers";

import "./assets/loadLevel";
import {
    GRAVITY
} from "./constants";
import "./cursor";
import "./cursorControlsImpl";
import { player } from "./player";
import "./player/controls/impl";
import "./player/states";
import "./ui";

K.setGravity(GRAVITY);
const follower = player.camFollower!;

