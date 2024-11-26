import { ColorComp, GameObj, PosComp, TextComp } from "kaplay";
import { UI } from ".";
import { MARGIN, SCALE } from "../constants";
import { K } from "../init";
import { player } from "../player";
import { uiButton } from "../components/uiButton";

export const healthbar = UI.add([
    K.pos(),
    K.text("", { size: 12 / SCALE }),
    K.anchor("botleft"),
    K.color(K.GREEN),
    K.area(),
    {
        add(this: GameObj<PosComp>) {
            const func = () => {
                this.pos = K.vec2(MARGIN, K.height() * (1 + +player.hidden) - MARGIN);
            };
            K.onResize(func);
            func();
        },
        showHealth(this: GameObj<PosComp | TextComp | ColorComp>,
            health: number, maxHealth: number) {
            const fraction = health / maxHealth;
            const barWidthChars = Math.floor(K.width() / this.textSize / 5 - 2);
            const numFilled = K.clamp(Math.floor(fraction * barWidthChars), 0, barWidthChars);
            const numEmpty = K.clamp(Math.ceil((1 - fraction) * barWidthChars), 0, barWidthChars);
            this.text = `[${"#".repeat(numFilled)}${" ".repeat(numEmpty)}] ${(fraction * 100).toFixed(0)}%`;
            this.color = fraction > 0.5 ? K.GREEN : fraction > 0.2 ? K.YELLOW : K.RED;
        }
    }
]);
healthbar.use(uiButton(() => { }));

player.onUpdate(() => {
    healthbar.showHealth(player.hp(), player.maxHP()!);
});
