/**
 * Component for a UI button
 */
export function uiButton(cb: () => void) {
    return {
        id: "ui-button",
        require: ["area"],
        add() {
            if (cb) this.onClick(cb);
        }
    };
}
