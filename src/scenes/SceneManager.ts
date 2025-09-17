import { K } from "../context";
import { mainMenuScene } from "./mainMenu";
import { splashScreenScene } from "./splash";

export enum Scene {
    SPLASH_SCREEN = "s",
    MAIN_MENU = "m",
}

export function setupScenes() {
    K.loadHappy(); // for the splash screen font
    K.scene(Scene.SPLASH_SCREEN, splashScreenScene);
    K.scene(Scene.MAIN_MENU, mainMenuScene);
}
