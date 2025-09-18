import * as BlueScreen from "../BlueScreen";
import { K } from "../context";

export function mainMenuScene() {
    BlueScreen.install();
    K.add([
        K.pos(K.center()),
        K.text("stuff here lol", { size: 16, align: "center" }),
    ])
    // K.add([
    //     K.sprite("gameLogo"),
    // ])
    myFunction();
}
function myFunction() {
    myFunction2();
}

function myFunction2() {
    throw new RangeError("Surely you're joking, Mr Feynman.")
}
