import { GameObj, PosComp, TextComp } from "kaplay";
import { UI } from ".";
import { uiButton } from "../components/uiButton";
import { MARGIN, SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { healthbar } from "./healthbar";

function updateInventory() {
    if (player.inventory.length === 0) {
        inventory.text = "";
        return;
    }
    if (player.holdingItem === undefined) {
        inventory.text = "nothing";
        return;
    }
    const name = player.holdingItem.name;
    inventory.text = name;
    const countAll = player.inventory.map(i => +(i.name === name)).reduce((a, b) => a + b, 0);
    const countBefore = player.inventory.slice(0, player.holdingIndex).map(i => +(i.name === name)).reduce((a, b) => a + b, 1);
    if (countAll > 1) inventory.text += ` (${countBefore}/${countAll})`;
}

const btnLeft = UI.add([
    K.text("\x11", {
        size: 32 / SCALE,
    }),
    K.pos(),
    K.area(),
    K.layer("ui"),
    K.anchor("botleft"),
    K.color(K.GREEN.darken(127)),
    {
        add(this: GameObj<PosComp | TextComp>) {
            const func = () => {
                this.pos = K.vec2(MARGIN, K.height() - (MARGIN * 2 + healthbar.height)
                    + K.height() * +(!player.canScrollInventory(-1) || player.hidden));
            };
            K.onResize(func);
            player.on("inventoryChange", func);
            func();
        }
    }
]);
btnLeft.use(uiButton(() => player.scrollInventory(-1)));
const inventory = UI.add([
    K.text("foo", {
        size: 16 / SCALE,
        width: TILE_SIZE * 6 / SCALE,
        align: "center"
    }),
    K.pos(),
    K.area(),
    K.layer("ui"),
    K.anchor("botleft"),
    K.color(K.GREEN.darken(50)),
    {
        add(this: GameObj<PosComp | TextComp>) {
            const func = () => {
                this.pos = K.vec2(
                    MARGIN + btnLeft.pos.x + btnLeft.width,
                    -(MARGIN * 2 + healthbar.height) + K.height() * (1 + +player.hidden));
            };
            K.onResize(func);
            player.on("inventoryChange", func);
            func();
        }
    }
]);
const btnRight = UI.add([
    K.text("\x10", {
        size: 32 / SCALE,
    }),
    K.pos(),
    K.area(),
    K.layer("ui"),
    K.anchor("botleft"),
    K.color(K.GREEN.darken(127)),
    {
        add(this: GameObj<PosComp | TextComp>) {
            const func = () => {
                this.pos = K.vec2(
                    MARGIN + inventory.pos.x + inventory.width,
                    -(MARGIN * 2 + healthbar.height) + K.height() * (1 + +(!player.canScrollInventory(1) || player.hidden)));
            };
            K.onResize(func);
            player.on("inventoryChange", func);
            func();
        }
    }
]);
btnRight.use(uiButton(() => player.scrollInventory(1)));
updateInventory();
player.on("inventoryChange", updateInventory);
