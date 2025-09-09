import { ColorComp, GameObj, PosComp, TextComp } from "kaplay";
import { UI } from ".";
import { uiButton } from "../components/uiButton";
import { MARGIN, SCALE } from "../constants";
import { K } from "../init";
import { player } from "../player";

export const healthbar = UI.add([
    K.pos(),
    K.text("", { size: 16 / SCALE }),
    K.anchor("botleft"),
    K.color(K.GREEN),
    K.layer("ui"),
    K.area(),
    {
        update(this: GameObj<PosComp>) {
            this.pos = K.vec2(MARGIN, K.height() * (1 + +player.hidden) - MARGIN);
        },
        showHealth(this: GameObj<PosComp | TextComp | ColorComp>,
            health: number, maxHealth: number) {
            const fraction = health / maxHealth;
            const barWidthChars = Math.floor(K.width() / this.textSize / 7 - 2) * 2; // * 2 because font is 2:1 so we can have twice as many characters
            const numFilled = K.clamp(Math.floor(fraction * barWidthChars), 0, barWidthChars);
            const numEmpty = K.clamp(Math.ceil((1 - fraction) * barWidthChars), 0, barWidthChars);
            this.text = `♡ [${"#".repeat(numFilled)}${" ".repeat(numEmpty)}] ${(fraction * 100).toFixed(0)}%`;
            this.color = fraction > 0.5 ? K.GREEN : fraction > 0.2 ? K.YELLOW : K.RED;
        }
    }
]);
healthbar.use(uiButton(() => { }));

player.onUpdate(() => {
    healthbar.showHealth(player.hp, player.maxHP!);
});
