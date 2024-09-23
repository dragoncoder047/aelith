import { player } from '../main';

/**
 * Component for a grabbable object, i.e. something that
 * can be picked up by the player when clicked.
 */
export function grabbable() {
    return {
        id: "grabbable",
        require: ["area", "z", "body"],
        /**
         * @type {import("kaplay").KEventController?}
         */
        physicsFoo: null,
        add() {
            this.onClick(() => {
                if (player.canTouch(this)) {
                    if (player.grabbing === this) {
                        player.grabbing = null;
                    }
                    else {
                        player.grabbing = this;
                    }
                }
            });
            this.onBeforePhysicsResolve(coll => {
                if (player.grabbing === this) coll.preventResolution();
            });
        },
        update() {
            if (player.grabbing === this) {
                this.z = Number.MAX_VALUE;
            }
            else {
                this.z = 0;
            }
        }
    };
}
