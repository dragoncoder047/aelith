import { GameObj, PosComp, TextComp, TweenController } from "kaplay";
import { UI } from ".";
import { uiButton } from "../components/uiButton";
import { MARGIN, SCALE, TILE_SIZE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { healthbar } from "./healthbar";

const INV_BTN_COLOR = K.GREEN.darken(127);

const btnLeft = UI.add([
    K.text("\u25C4", {
        size: 32 / SCALE,
    }),
    K.pos(),
    K.area(),
    K.layer("ui"),
    K.anchor("botleft"),
    K.color(INV_BTN_COLOR),
    {
        update(this: GameObj<PosComp | TextComp>) {
            this.pos = K.vec2(MARGIN, K.height() - (MARGIN * 2 + healthbar.height)
                + K.height() * +(!player.canScrollInventory(-1) || player.hidden));
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
    K.color(INV_BTN_COLOR),
    {
        update(this: GameObj<PosComp | TextComp>) {
            this.pos = K.vec2(
                MARGIN + btnLeft.pos.x + btnLeft.width,
                -(MARGIN * 2 + healthbar.height) + K.height() * (1 + +player.hidden));

            if (player.inventory.length === 0 || player.hidden) {
                this.text = "";
                return;
            }
            if (player.holdingItem === undefined) {
                this.text = "nothing";
                return;
            }
            const name = player.holdingItem.name;
            this.text = name;
            const countAll = player.inventory.map(i => +(i.name === name)).reduce((a, b) => a + b, 0);
            const countBefore = player.inventory.slice(0, player.holdingIndex).map(i => +(i.name === name)).reduce((a, b) => a + b, 1);
            if (countAll > 1) this.text += ` (${countBefore}/${countAll})`;

        }
    }
]);
const btnRight = UI.add([
    K.text("\u25BA", {
        size: 32 / SCALE,
    }),
    K.pos(),
    K.area(),
    K.layer("ui"),
    K.anchor("botleft"),
    K.color(INV_BTN_COLOR),
    {
        update(this: GameObj<PosComp | TextComp>) {
            this.pos = K.vec2(
                MARGIN + inventory.pos.x + inventory.width,
                -(MARGIN * 2 + healthbar.height) + K.height() * (1 + +(!player.canScrollInventory(1) || player.hidden)));
        }
    }
]);
btnRight.use(uiButton(() => player.scrollInventory(1)));

var _tweener: TweenController;
player.on("inventoryChange", () => {
    _tweener?.finish();
    _tweener = K.tween(K.WHITE, INV_BTN_COLOR, .2, c => {
        btnLeft.color = btnRight.color = inventory.color = c;
    });
});
