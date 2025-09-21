import { Comp } from "kaplay";
import { javaHash } from "../utils";
import { drawPrimitive, Primitive } from "./primitive";

export interface MultiprimitiveComp extends Comp {
    primitives: Primitive[];
    rand: number;
}

export function multiprimitive(id: string, primitives: Primitive[]): MultiprimitiveComp {
    return {
        id: "multiprimitive",
        primitives,
        rand: javaHash(id),
        draw() {
            for (var p of this.primitives) {
                drawPrimitive(this.rand, p);
            }
        }
    }
}
