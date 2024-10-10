import { GameObj, PosComp, TextComp } from "kaplay";
import { UI } from ".";
import { K } from "../init";
import { uiButton } from "../components/uiButton";
import { MARGIN, SCALE } from "../constants";

const inventory = UI.add([
    K.text("", {
        size: 24 / SCALE,
        font: "IBM Mono",
    }),
    K.pos(),
    K.area(),
    K.layer("ui"),
    K.anchor("botleft"),
    {
        update(this: GameObj<PosComp | TextComp>) {
            this.pos = K.vec2(MARGIN, K.height() - MARGIN);
        }
    }
]);
inventory.use(uiButton(() => K.debug.log("happy")));

inventory.text = "\x11 foo \x10";
inventory.color = K.WHITE.darken(127);
