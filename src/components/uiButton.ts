import { AreaComp, Comp, GameObj } from "kaplay";

export interface UIButtonComp extends Comp {
}

/**
 * Component for a UI button
 */
export function uiButton(cb: () => void): UIButtonComp {
    return {
        id: "ui-button",
        require: ["area"],
        add(this: GameObj<AreaComp>) {
            if (cb) this.onClick(cb);
        }
    };
}
