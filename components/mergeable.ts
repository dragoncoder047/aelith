import { Comp, GameObj, SpriteComp } from "kaplay";

export interface MergeableComp extends Comp {
    widthToAdd: number
    modifyWidth(width: number): void
}

export function mergeable(): MergeableComp {
    return {
        widthToAdd: 0,
        id: "mergeable",
        add(this: GameObj<SpriteComp | MergeableComp>) {
            const zz = this.onUpdate(() => {
                if (this.width > 0) {
                    this.width += this.widthToAdd;
                    zz.cancel();
                    this.unuse("mergeable");
                }
            });
        },
        modifyWidth(width) {
            this.widthToAdd += width;
        }
    };
}