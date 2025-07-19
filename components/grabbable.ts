import { AreaComp, Comp, GameObj, KEventController, LayerComp } from "kaplay";
import { player } from "../player";
import { PlayerInventoryItem } from "../player/body";

export interface GrabbableComp extends Comp {
}

/**
 * Component for a grabbable object, i.e. something that
 * can be picked up by the player when clicked.
 */
export function grabbable(): GrabbableComp {
    return {
        id: "grabbable",
        require: ["area", "body", "pos"],
        add(this: PlayerInventoryItem & GameObj<AreaComp | LayerComp | GrabbableComp>) {
            this.on("interact", () => {
                player.grab(this);
            });
            this.onBeforePhysicsResolve(coll => {
                if (player.inventory.includes(this)) coll.preventResolution();
            });
        },
        destroy(this: PlayerInventoryItem) {
            if (player.inventory.includes(this)) player.drop(this);
        }
    };
}
