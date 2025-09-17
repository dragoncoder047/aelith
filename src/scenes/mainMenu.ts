import { K } from "../context";

export function mainMenuScene() {
    K.add([
        K.pos(K.center()),
        K.text("stuff here lol", { size: 16, align: "center" }),
    ])
    // K.add([
    //     K.sprite("gameLogo"),
    // ])
}