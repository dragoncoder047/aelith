import K from '../init';

/**
 * @param  {...any} by
 */
export function nudge(...by) {
    return {
        id: "nudge",
        require: ["pos"],
        add() {
            const x = K.onUpdate(() => {
                this.moveBy(K.vec2(...by));
                this.unuse("nudge");
                x.cancel();
            });
        }
    };
}
