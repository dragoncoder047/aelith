import { Comp } from "kaplay";

export interface ClimbableComp extends Comp {
}
export function climbable(): ClimbableComp {
    return {
        id: "climbable"
    }
}
