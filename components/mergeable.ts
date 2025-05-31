import { Comp, GameObj, PosComp, SpriteComp, Vec2 } from "kaplay";
import { K } from "../init";
import { TILE_SIZE } from "../constants";

export interface MergeableComp extends Comp {
    squares: Vec2[]
    addSquare(pos: Vec2): void
    modifyWidth(width: number): void
    modifyHeight(width: number): void
}

export function mergeable(): MergeableComp {
    return {
        squares: [],
        id: "mergeable",
        require: ["pos"],
        add(this: GameObj<SpriteComp | MergeableComp | PosComp>) {
            this.on("preprocess", () => {
                this.squares.push(this.pos);
                return K.cancel();
            });
        },
        addSquare(pos) {
            this.squares.push(pos);
        },
        modifyWidth(this: GameObj<SpriteComp | PosComp>, width) {
            this.width += width * TILE_SIZE;
            this.pos.x += (width * TILE_SIZE) / 2;
        },
        modifyHeight(this: GameObj<SpriteComp | PosComp>, height) {
            this.height += height * TILE_SIZE;
            this.pos.y += (height * TILE_SIZE) / 2;
        }
    };
}
