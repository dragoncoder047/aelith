// cSpell: ignore kaplay

import { K } from "./init";
import "./layers";

import "./assets/loadLevel";
import {
    GRAVITY
} from "./constants";
import "./controlsImpl";
import "./cursor";
import "./cursorControlsImpl";
import { player } from "./player";
import "./playerStateManage";
import "./ui";

K.setGravity(GRAVITY);
const follower = player.camFollower!;

