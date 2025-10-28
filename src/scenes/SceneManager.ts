import { K } from "../context";
import { titleScreenScene } from "./titleScreen";
import { menuScene } from "./menuScene";
import { roomScene } from "./room";
import { splashScreenScene } from "./splash";

export enum Scene {
    SPLASH_SCREEN = "scene",
    MAIN_MENU = "mainMenu",
    ROOM = "room",
    MENU = "menu",
}

export function setupScenes() {
    K.loadHappy(); // for the splash screen font
    K.scene(Scene.SPLASH_SCREEN, splashScreenScene);
    K.scene(Scene.MAIN_MENU, titleScreenScene);
    K.scene(Scene.ROOM, roomScene);
    K.scene(Scene.MENU, menuScene);
}
