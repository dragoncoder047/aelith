import { AreaComp, Comp, GameObj, KEventController, LayerComp, Vec2 } from "kaplay";
import { player, PlayerInventoryItem } from "../player";

export interface GrabbableComp extends Comp {
    oldLayer: string,
}

/**
 * Component for a grabbable object, i.e. something that
 * can be picked up by the player when clicked.
 */
export function grabbable(): GrabbableComp {
    return {
        id: "grabbable",
        require: ["area", "body", "pos"],
        oldLayer: "",
        add(this: PlayerInventoryItem & GameObj<AreaComp | LayerComp | GrabbableComp>) {
            this.on("interact", () => {
                if (player.holdingItem === this) {
                    player.drop(this);
                }
                else {
                    this.oldLayer = this.layer!;
                    player.grab(this);
                }
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
        },
        destroy(this: PlayerInventoryItem) {
            if (player.inventory.includes(this)) player.drop(this);
        }
    };
}
