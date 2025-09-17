import { K } from "../context";
import { mainMenuScene } from "./mainMenu";
import { splashScreenScene } from "./splash";

export enum Scene {
    SPLASH = "splash",
    MAIN_MENU = "mainMenu",
}

export function setupScenes() {
    K.loadHappy(); // for the splash screen font
    K.scene(Scene.SPLASH, splashScreenScene);
    K.scene(Scene.MAIN_MENU, mainMenuScene);
}
