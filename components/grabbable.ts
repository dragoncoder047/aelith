import { AreaComp, Comp, GameObj, KEventController, LayerComp } from "kaplay";
import { player, PlayerInventoryItem } from "../player";

export interface GrabbableComp extends Comp {
    physicsFoo: KEventController | undefined,
    oldLayer: string
}

/**
 * Component for a grabbable object, i.e. something that
 * can be picked up by the player when clicked.
 */
export function grabbable(): GrabbableComp {
    return {
        id: "grabbable",
        require: ["area", "body", "pos"],
        physicsFoo: undefined,
        oldLayer: "",
        add(this: PlayerInventoryItem & GameObj<AreaComp | LayerComp | GrabbableComp>) {
            this.onClick(() => {
                if (player.canTouch(this)) {
                    if (player.holdingItem === this) {
                        player.drop(this);
                    }
                    else {
                        this.oldLayer = this.layer!;
                        player.grab(this);
                    }
                }
            });
            this.onBeforePhysicsResolve(coll => {
                if (player.holdingItem === this) coll.preventResolution();
            });
        },
        update(this: PlayerInventoryItem & GameObj<AreaComp | LayerComp | GrabbableComp>) {
            // there must be a better way to do this
            if (player.holdingItem === this) {
                this.layer = "grabbing";
            }
            else if (this.oldLayer != "") {
                this.layer = this.oldLayer;
                this.oldLayer = "";
            }
        }
    };
}
