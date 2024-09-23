import { AreaComp, GameObj } from "kaplay";

/**
 * Component for a UI button
 */
export function uiButton(cb: () => void) {
    return {
        id: "ui-button",
        require: ["area"],
        add(this: GameObj<AreaComp>) {
            if (cb) this.onClick(cb);
        }
    };
}
