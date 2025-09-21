import { K } from "../context";
import { mainMenuScene } from "./mainMenu";
import { roomScene } from "./room";
import { splashScreenScene } from "./splash";

export enum Scene {
    SPLASH_SCREEN = "s",
    MAIN_MENU = "m",
    ROOM = "r",
}

export function setupScenes() {
    K.loadHappy(); // for the splash screen font
    K.scene(Scene.SPLASH_SCREEN, splashScreenScene);
    K.scene(Scene.MAIN_MENU, mainMenuScene);
    K.scene(Scene.ROOM, roomScene);
}
