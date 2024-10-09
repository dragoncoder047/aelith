// cSpell: ignore kaplay

import { K } from "./init";
import "./layers";

import "./assets/loadLevel";
import {
    GRAVITY
} from "./constants";
import "./player/controls/impl";
import "./cursor";
import "./cursorControlsImpl";
import { player } from "./player";
import "./player/states";
import "./ui";

K.setGravity(GRAVITY);
const follower = player.camFollower!;

