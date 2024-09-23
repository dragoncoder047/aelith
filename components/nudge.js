import K from '../init.js';

// Helper component
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
