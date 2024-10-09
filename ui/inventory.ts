import { GameObj, PosComp, TextComp } from "kaplay";
import { UI } from ".";
import { K } from "../init";
import { uiButton } from "../components/uiButton";
import { MARGIN, SCALE } from "../constants";

const inventory = UI.add([
    K.text("", {
        size: 16 / SCALE,
        font: "IBM Mono",
    }),
    K.pos(),
    K.area(),
    K.layer("ui"),
    {
        update(this: GameObj<PosComp | TextComp>) {
            this.pos = K.vec2(MARGIN, K.height() - MARGIN - this.height);
        }
    }
]);
inventory.use(uiButton(() => alert("happy")));

inventory.text = "\x11 foo \x10";
