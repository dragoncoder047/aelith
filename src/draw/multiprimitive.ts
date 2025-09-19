import { Comp } from "kaplay";
import { drawPrimitive, Primitive } from "./primitive";

export interface MultiprimitiveComp extends Comp {
    primitives: Primitive[]
}

export function multiprimitive(primitives: Primitive[]): MultiprimitiveComp {
    return {
        id: "multiprimitive",
        primitives,
        draw() {
            for (var p of this.primitives) {
                drawPrimitive(p);
            }
        }
    }
}
