import { Comp, Vec2 } from "kaplay"

export interface HoldOffsetComp extends Comp {
    holdOffset: Vec2
}

export function holdOffset(offset: Vec2): HoldOffsetComp {
    return {
        id: "hold-offset",
        holdOffset: offset
    }
}
