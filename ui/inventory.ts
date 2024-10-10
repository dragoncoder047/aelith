import { GameObj, PosComp, TextComp } from "kaplay";
import { UI } from ".";
import { K } from "../init";
import { uiButton } from "../components/uiButton";
import { MARGIN, SCALE, TILE_SIZE } from "../constants";
import { player } from "../player";

function updateInventory() {
    const holdingItem = player.inventory[player.holdingIndex];
    if (holdingItem === undefined) {
        inventory.text = "nothing";
        return;
    }
    const name = holdingItem.name;
    inventory.text = name;
    const countAll = player.inventory.map(i => +(i.name === name)).reduce((a, b) => a + b, 0);
    const countBefore = player.inventory.slice(0, player.holdingIndex).map(i => +(i.name === name)).reduce((a, b) => a + b, 1);
    if (countAll > 1) inventory.text += ` (${countBefore}/${countAll})`;
}

const btnLeft = UI.add([
    K.text("\x11", {
        size: 32 / SCALE,
        font: "IBM Mono",
    }),
    K.pos(),
    K.area(),
    K.layer("ui"),
    K.anchor("botleft"),
    K.color(K.GREEN.darken(127)),
    {
        update(this: GameObj<PosComp | TextComp>) {
            this.pos = K.vec2(MARGIN, K.height() - MARGIN);
        }
    }
]);
btnLeft.use(uiButton(() => {
    player.holdingIndex = (player.holdingIndex + player.inventory.length - 1) % player.inventory.length;
    updateInventory();
}));
const inventory = UI.add([
    K.text("foo", {
        size: 16 / SCALE,
        font: "IBM Mono",
        width: TILE_SIZE * 2,
        align: "center"
    }),
    K.pos(),
    K.area(),
    K.layer("ui"),
    K.anchor("botleft"),
    K.color(K.GREEN.darken(50)),
    {
        update(this: GameObj<PosComp | TextComp>) {
            this.pos = K.vec2(MARGIN + btnLeft.pos.x + btnLeft.width,
                K.height() - MARGIN);
        }
    }
]);
const btnRight = UI.add([
    K.text("\x10", {
        size: 32 / SCALE,
        font: "IBM Mono",
    }),
    K.pos(),
    K.area(),
    K.layer("ui"),
    K.anchor("botleft"),
    K.color(K.GREEN.darken(127)),
    {
        update(this: GameObj<PosComp | TextComp>) {
            this.pos = K.vec2(MARGIN + inventory.pos.x + inventory.width,
                K.height() - MARGIN);
        }
    }
]);
btnRight.use(uiButton(() => {
    player.holdingIndex = (player.holdingIndex + 1) % player.inventory.length;
    updateInventory();
}));
updateInventory();
player.on("inventoryChange", updateInventory);
